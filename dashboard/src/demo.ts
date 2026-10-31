import { buildProject, mediaKind, type ProjectFiles } from './parse';
import type { DataSource, MediaFile, Project, ProjectRef, PullRequest } from './types';

// Bundled at build time: the hub's own tracking plus a fictional sample game.
const hubText = import.meta.glob('../../PROJECT/**/*.{md,yml}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const sampleText = import.meta.glob('./demo/sample-game/PROJECT/**/*.{md,yml}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const sampleMedia = import.meta.glob('./demo/sample-game/PROJECT/media/*', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

function files(text: Record<string, string>, media: Record<string, string>, root: string): ProjectFiles & { urls: Map<string, string> } {
  const rel = (p: string) => p.slice(p.indexOf(root) + root.length);
  const out = { text: new Map<string, string>(), media: [] as MediaFile[], urls: new Map<string, string>() };
  for (const [p, t] of Object.entries(text)) out.text.set(rel(p), t);
  for (const [p, url] of Object.entries(media)) {
    const path = rel(p);
    const kind = mediaKind(path);
    if (!kind) continue;
    out.media.push({ path, name: path.slice('media/'.length), sha: path, kind });
    out.urls.set(path, url);
  }
  return out;
}

const SAMPLE_PRS: PullRequest[] = [
  { number: 14, title: 'Oil gauge HUD (T-008)', url: 'https://github.com/example/lantern-keeper/pull/14', draft: false, author: 'claude', updatedAt: '2026-10-30T18:20:00Z', ci: 'success' },
  { number: 15, title: 'WIP: storm director curve (T-007)', url: 'https://github.com/example/lantern-keeper/pull/15', draft: true, author: 'claude', updatedAt: '2026-10-31T09:05:00Z', ci: 'pending' },
];

const DEMO: Record<string, { files: ReturnType<typeof files>; prs: PullRequest[]; htmlUrl: string }> = {
  'example/lantern-keeper': {
    files: files(sampleText, sampleMedia, '/sample-game/PROJECT/'),
    prs: SAMPLE_PRS,
    htmlUrl: 'https://github.com/example/lantern-keeper',
  },
  'demo/project-hub': {
    files: files(hubText, {}, '/PROJECT/'),
    prs: [],
    htmlUrl: 'https://github.com/demo/project-hub',
  },
};

export class DemoSource implements DataSource {
  readonly kind = 'demo' as const;

  async listProjects(): Promise<ProjectRef[]> {
    return Object.keys(DEMO).map((repo) => ({ repo }));
  }

  async loadProject(ref: ProjectRef): Promise<Project> {
    const d = DEMO[ref.repo];
    if (!d) throw new Error(`Unknown demo project ${ref.repo}`);
    return buildProject(ref, { branch: 'main', htmlUrl: d.htmlUrl, hasKit: true, prs: d.prs, ci: 'success' }, d.files);
  }

  async mediaUrl(project: Project, file: MediaFile): Promise<string> {
    return DEMO[project.ref.repo]?.files.urls.get(file.path) ?? '';
  }

  fileUrl(): null {
    return null;
  }
}
