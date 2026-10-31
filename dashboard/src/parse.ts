import { parse as parseYaml } from 'yaml';
import {
  TASK_STATUSES,
  type CiState,
  type Decision,
  type DevlogEntry,
  type InboxItem,
  type MediaFile,
  type Project,
  type ProjectMeta,
  type ProjectRef,
  type PullRequest,
  type Task,
  type TaskStatus,
} from './types';

type Meta = Record<string, unknown>;

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function splitFrontMatter(text: string): { meta: Meta; body: string } {
  const m = FRONT_MATTER.exec(text);
  if (!m) return { meta: {}, body: text };
  return { meta: parseYamlObject(m[1]), body: text.slice(m[0].length).trim() };
}

function parseYamlObject(src: string): Meta {
  try {
    const v: unknown = parseYaml(src);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Meta) : {};
  } catch {
    return {};
  }
}

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());
const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(str).filter(Boolean) : str(v) ? [str(v)] : [];

function taskStatus(v: unknown): TaskStatus {
  const s = str(v).toLowerCase();
  return (TASK_STATUSES as readonly string[]).includes(s) ? (s as TaskStatus) : 'backlog';
}

/** `tasks/T-001-foo.md` → `T-001` when front matter has no id. */
function idFromPath(path: string): string {
  const name = path.split('/').pop() ?? path;
  return /^([A-Z]+-\d+)/.exec(name)?.[1] ?? name.replace(/\.md$/, '');
}

export function parseTask(path: string, text: string): Task {
  const { meta, body } = splitFrontMatter(text);
  return {
    path,
    id: str(meta.id) || idFromPath(path),
    title: str(meta.title) || idFromPath(path),
    status: taskStatus(meta.status),
    milestone: str(meta.milestone),
    system: str(meta.system),
    owner: str(meta.owner).toLowerCase() || 'claude',
    context: list(meta.context),
    doneWhen: list(meta.done_when),
    pr: str(meta.pr),
    body,
  };
}

export function parseDecision(path: string, text: string): Decision {
  const { meta, body } = splitFrontMatter(text);
  return {
    path,
    id: str(meta.id) || idFromPath(path),
    title: str(meta.title) || idFromPath(path),
    status: str(meta.status).toLowerCase() || 'proposed',
    date: str(meta.date),
    source: str(meta.source),
    body,
  };
}

export function parseDevlog(path: string, text: string): DevlogEntry {
  const { meta, body } = splitFrontMatter(text);
  const name = path.split('/').pop() ?? '';
  return {
    path,
    date: str(meta.date) || (/^\d{4}-\d{2}-\d{2}/.exec(name)?.[0] ?? ''),
    tasks: list(meta.tasks),
    pr: str(meta.pr),
    media: list(meta.media),
    body,
  };
}

/** Checklist items from inbox.md, tagged with their `## ` section. Italic placeholders (`_..._`) are skipped. */
export function parseInbox(text: string): InboxItem[] {
  const items: InboxItem[] = [];
  let section = '';
  for (const line of text.split(/\r?\n/)) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) {
      section = h[1];
      continue;
    }
    const c = /^\s*[-*]\s+\[([ xX])\]\s+(.+?)\s*$/.exec(line);
    if (!c) continue;
    const itemText = c[2];
    if (/^_.*_$/.test(itemText)) continue;
    items.push({ section, text: itemText, checked: c[1] !== ' ' });
  }
  return items;
}

export function parseProjectMeta(text: string, fallbackName: string): ProjectMeta {
  const m = parseYamlObject(text);
  return {
    name: str(m.name) || fallbackName,
    type: str(m.type) || 'game',
    engine: str(m.engine),
    status: str(m.status) || 'active',
    milestone: str(m.milestone),
    tagline: str(m.tagline),
    playUrl: str(m.play_url),
  };
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

export function mediaKind(path: string): MediaFile['kind'] | null {
  if (IMAGE_EXT.test(path)) return 'image';
  if (VIDEO_EXT.test(path)) return 'video';
  return null;
}

export function mimeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
    svg: 'image/svg+xml', avif: 'image/avif', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  };
  return map[ext] ?? 'application/octet-stream';
}

/** Is this a tracked document (not a template)? Paths are relative to PROJECT/. */
export function isTrackedDoc(path: string, dir: 'tasks' | 'decisions' | 'devlog'): boolean {
  if (!path.startsWith(`${dir}/`) || !path.endsWith('.md')) return false;
  const name = path.slice(dir.length + 1);
  return !name.includes('/') && !name.startsWith('_') && name.toLowerCase() !== 'readme.md';
}

export interface ProjectFiles {
  /** Text contents keyed by path relative to PROJECT/. */
  text: Map<string, string>;
  media: MediaFile[];
}

export function buildProject(
  ref: ProjectRef,
  base: { branch: string; htmlUrl: string; hasKit: boolean; prs: PullRequest[]; ci: CiState },
  files: ProjectFiles,
): Project {
  const fallbackName = ref.repo.split('/').pop() ?? ref.repo;
  const docs = (dir: 'tasks' | 'decisions' | 'devlog') =>
    [...files.text.entries()].filter(([p]) => isTrackedDoc(p, dir));
  const inboxRaw = files.text.get('inbox.md') ?? '';

  const tasks = docs('tasks').map(([p, t]) => parseTask(p, t));
  tasks.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const decisions = docs('decisions').map(([p, t]) => parseDecision(p, t));
  decisions.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const devlog = docs('devlog').map(([p, t]) => parseDevlog(p, t));
  devlog.sort((a, b) => b.date.localeCompare(a.date) || b.path.localeCompare(a.path));
  const media = [...files.media].sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));

  return {
    ref,
    ...base,
    meta: parseProjectMeta(files.text.get('project.yml') ?? '', fallbackName),
    overview: files.text.get('overview.md') ?? '',
    roadmap: files.text.get('roadmap.md') ?? '',
    inboxRaw,
    inbox: parseInbox(inboxRaw),
    tasks,
    decisions,
    devlog,
    media,
  };
}

/** Collapse a set of workflow runs for one commit into one state. */
export function aggregateCi(runs: { status: string; conclusion: string | null }[]): CiState {
  if (runs.length === 0) return 'none';
  if (runs.some((r) => r.status !== 'completed')) return 'pending';
  if (runs.some((r) => r.conclusion === 'failure' || r.conclusion === 'timed_out' || r.conclusion === 'startup_failure'))
    return 'failure';
  return 'success';
}

export function parseProjectsJson(text: string): ProjectRef[] {
  const data: unknown = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data as { projects?: unknown }).projects;
  if (!Array.isArray(arr)) throw new Error('projects.json must be an array or { "projects": [...] }');
  return arr.map((p): ProjectRef => {
    if (typeof p === 'string') return { repo: p };
    const o = p as { repo?: unknown; branch?: unknown };
    if (typeof o.repo !== 'string' || !o.repo.includes('/')) throw new Error(`Invalid project entry: ${JSON.stringify(p)}`);
    return { repo: o.repo, branch: typeof o.branch === 'string' && o.branch ? o.branch : undefined };
  });
}
