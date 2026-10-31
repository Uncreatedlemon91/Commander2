import { aggregateCi, buildProject, mediaKind, mimeFor, parseProjectsJson, type ProjectFiles } from './parse';
import type { CiState, DataSource, MediaFile, Project, ProjectRef, PullRequest } from './types';

const API = 'https://api.github.com';
const RAW = 'application/vnd.github.raw';

interface TreeEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
}
interface WorkflowRun {
  head_sha: string;
  head_branch: string | null;
  status: string;
  conclusion: string | null;
}

/** Git blob SHAs are content hashes, so a cached blob never goes stale. */
const memBlobs = new Map<string, string>();
const BLOB_KEY = 'hub.blob.';

function cachedBlob(sha: string): string | undefined {
  const hit = memBlobs.get(sha);
  if (hit !== undefined) return hit;
  try {
    const v = localStorage.getItem(BLOB_KEY + sha);
    if (v !== null) memBlobs.set(sha, v);
    return v ?? undefined;
  } catch {
    return undefined;
  }
}

function storeBlob(sha: string, text: string): void {
  memBlobs.set(sha, text);
  try {
    localStorage.setItem(BLOB_KEY + sha, text);
  } catch {
    // Storage full or unavailable: the memory cache still covers this session.
  }
}

export function clearBlobCache(): void {
  memBlobs.clear();
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(BLOB_KEY)) localStorage.removeItem(k);
  } catch {
    // ignore
  }
}

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export class GitHubSource implements DataSource {
  readonly kind = 'github' as const;
  private mediaCache = new Map<string, Promise<string>>();

  constructor(
    private token: string,
    private hubRepo: string,
    private hubBranch: string,
  ) {}

  private async request(path: string, accept = 'application/vnd.github+json'): Promise<Response> {
    const res = await fetch(`${API}${path}`, {
      headers: {
        Accept: accept,
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        detail = ((await res.json()) as { message?: string }).message ?? detail;
      } catch {
        // non-JSON error body
      }
      const hint =
        res.status === 401 ? ' (token invalid or expired)' : res.status === 404 ? ' (not found, or the token has no access to it)' : '';
      throw new GitHubError(`GitHub ${res.status}: ${detail}${hint}`, res.status);
    }
    return res;
  }

  private async json<T>(path: string): Promise<T> {
    return (await this.request(path)).json() as Promise<T>;
  }

  private async blobText(repo: string, sha: string): Promise<string> {
    const hit = cachedBlob(sha);
    if (hit !== undefined) return hit;
    const text = await (await this.request(`/repos/${repo}/git/blobs/${sha}`, RAW)).text();
    storeBlob(sha, text);
    return text;
  }

  async listProjects(): Promise<ProjectRef[]> {
    const ref = this.hubBranch ? `?ref=${encodeURIComponent(this.hubBranch)}` : '';
    const res = await this.request(`/repos/${this.hubRepo}/contents/projects.json${ref}`, RAW);
    return parseProjectsJson(await res.text());
  }

  async loadProject(ref: ProjectRef): Promise<Project> {
    const { repo } = ref;
    const info = await this.json<{ default_branch: string; html_url: string }>(`/repos/${repo}`);
    const branch = ref.branch ?? info.default_branch;
    const q = `?ref=${encodeURIComponent(branch)}`;

    const [root, prs, runs] = await Promise.all([
      this.json<{ name: string; type: string; sha: string }[]>(`/repos/${repo}/contents/${q}`),
      this.pulls(repo),
      this.runs(repo),
    ]);

    const files: ProjectFiles = { text: new Map(), media: [] };
    const dir = root.find((e) => e.name === 'PROJECT' && e.type === 'dir');
    if (dir) {
      const tree = await this.json<{ tree: TreeEntry[] }>(`/repos/${repo}/git/trees/${dir.sha}?recursive=1`);
      const textEntries = tree.tree.filter((e) => e.type === 'blob' && /\.(md|ya?ml)$/i.test(e.path));
      const texts = await Promise.all(textEntries.map((e) => this.blobText(repo, e.sha)));
      textEntries.forEach((e, i) => files.text.set(e.path, texts[i]));
      for (const e of tree.tree) {
        const kind = e.type === 'blob' && e.path.startsWith('media/') ? mediaKind(e.path) : null;
        if (kind) files.media.push({ path: e.path, name: e.path.slice('media/'.length), sha: e.sha, kind });
      }
    }

    const ciFor = (sha: string): CiState => aggregateCi(runs.filter((r) => r.head_sha === sha));
    const branchHead = runs.find((r) => r.head_branch === branch)?.head_sha;

    return buildProject(
      ref,
      {
        branch,
        htmlUrl: info.html_url,
        hasKit: Boolean(dir),
        prs: prs.map((p) => ({ ...p.pr, ci: ciFor(p.headSha) })),
        ci: branchHead ? ciFor(branchHead) : 'none',
      },
      files,
    );
  }

  private async pulls(repo: string): Promise<{ pr: Omit<PullRequest, 'ci'>; headSha: string }[]> {
    const raw = await this.json<
      { number: number; title: string; html_url: string; draft: boolean; user: { login: string } | null; updated_at: string; head: { sha: string } }[]
    >(`/repos/${repo}/pulls?state=open&per_page=30&sort=updated&direction=desc`);
    return raw.map((p) => ({
      pr: { number: p.number, title: p.title, url: p.html_url, draft: p.draft, author: p.user?.login ?? '', updatedAt: p.updated_at },
      headSha: p.head.sha,
    }));
  }

  private async runs(repo: string): Promise<WorkflowRun[]> {
    try {
      return (await this.json<{ workflow_runs: WorkflowRun[] }>(`/repos/${repo}/actions/runs?per_page=50`)).workflow_runs;
    } catch (e) {
      // A token without Actions read access just means no CI badges.
      if (e instanceof GitHubError && (e.status === 403 || e.status === 404)) return [];
      throw e;
    }
  }

  mediaUrl(project: Project, file: MediaFile): Promise<string> {
    const key = `${project.ref.repo}@${file.sha}`;
    let p = this.mediaCache.get(key);
    if (!p) {
      p = this.request(`/repos/${project.ref.repo}/git/blobs/${file.sha}`, RAW)
        .then((r) => r.arrayBuffer())
        .then((buf) => URL.createObjectURL(new Blob([buf], { type: mimeFor(file.path) })));
      p.catch(() => this.mediaCache.delete(key));
      this.mediaCache.set(key, p);
    }
    return p;
  }

  fileUrl(project: Project, path: string, edit = false): string {
    const encoded = `PROJECT/${path}`.split('/').map(encodeURIComponent).join('/');
    return `${project.htmlUrl}/${edit ? 'edit' : 'blob'}/${project.branch.split('/').map(encodeURIComponent).join('/')}/${encoded}`;
  }
}
