export const TASK_STATUSES = ['inbox', 'backlog', 'ready', 'in-progress', 'review', 'blocked', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type CiState = 'success' | 'failure' | 'pending' | 'none';

export interface ProjectRef {
  repo: string;
  branch?: string;
}

export interface ProjectMeta {
  name: string;
  type: string;
  engine: string;
  status: string;
  milestone: string;
  tagline: string;
  playUrl: string;
}

export interface Task {
  path: string;
  id: string;
  title: string;
  status: TaskStatus;
  milestone: string;
  system: string;
  owner: string;
  context: string[];
  doneWhen: string[];
  pr: string;
  body: string;
}

export interface Decision {
  path: string;
  id: string;
  title: string;
  status: string;
  date: string;
  source: string;
  body: string;
}

export interface DevlogEntry {
  path: string;
  date: string;
  tasks: string[];
  pr: string;
  media: string[];
  body: string;
}

export interface InboxItem {
  section: string;
  text: string;
  checked: boolean;
}

export interface MediaFile {
  path: string;
  name: string;
  sha: string;
  kind: 'image' | 'video';
}

export interface PullRequest {
  number: number;
  title: string;
  url: string;
  draft: boolean;
  author: string;
  updatedAt: string;
  ci: CiState;
}

export interface Project {
  ref: ProjectRef;
  branch: string;
  htmlUrl: string;
  hasKit: boolean;
  meta: ProjectMeta;
  overview: string;
  roadmap: string;
  inboxRaw: string;
  inbox: InboxItem[];
  tasks: Task[];
  decisions: Decision[];
  devlog: DevlogEntry[];
  media: MediaFile[];
  prs: PullRequest[];
  ci: CiState;
}

export interface DataSource {
  readonly kind: 'github' | 'demo';
  listProjects(): Promise<ProjectRef[]>;
  loadProject(ref: ProjectRef): Promise<Project>;
  mediaUrl(project: Project, file: MediaFile): Promise<string>;
  /** Link to view (or edit) a PROJECT/ file on GitHub, or null in demo mode. */
  fileUrl(project: Project, path: string, edit?: boolean): string | null;
}
