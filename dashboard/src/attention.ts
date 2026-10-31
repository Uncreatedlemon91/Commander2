import type { Project } from './types';

export type AttentionKind = 'decision' | 'playtest' | 'human-task' | 'review' | 'blocked' | 'ci';

export interface AttentionItem {
  kind: AttentionKind;
  project: Project;
  text: string;
  /** A task id to open, or an external URL. */
  taskId?: string;
  url?: string;
}

const ORDER: AttentionKind[] = ['ci', 'review', 'decision', 'human-task', 'playtest', 'blocked'];

/** Everything waiting on the owner, most urgent kinds first. */
export function attentionFor(project: Project): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (project.ci === 'failure') {
    items.push({ kind: 'ci', project, text: `CI failing on ${project.branch}`, url: `${project.htmlUrl}/actions` });
  }
  for (const pr of project.prs) {
    if (pr.draft) continue;
    const ci = pr.ci === 'failure' ? ' · CI failing' : pr.ci === 'pending' ? ' · CI running' : '';
    items.push({ kind: 'review', project, text: `PR #${pr.number}: ${pr.title}${ci}`, url: pr.url });
  }
  for (const item of project.inbox) {
    if (item.checked) continue;
    const playtest = /^playtest\b/i.test(item.text);
    if (playtest) items.push({ kind: 'playtest', project, text: item.text.replace(/^playtest:?\s*/i, '') });
    else if (/decision/i.test(item.section)) items.push({ kind: 'decision', project, text: item.text });
  }
  for (const t of project.tasks) {
    if (t.status === 'done') continue;
    if (t.owner === 'human') items.push({ kind: 'human-task', project, text: `${t.id}: ${t.title}`, taskId: t.id });
    else if (t.status === 'blocked') items.push({ kind: 'blocked', project, text: `${t.id}: ${t.title}`, taskId: t.id });
  }

  return items.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

export const ATTENTION_LABEL: Record<AttentionKind, string> = {
  ci: 'CI',
  review: 'Review',
  decision: 'Decide',
  'human-task': 'Your task',
  playtest: 'Playtest',
  blocked: 'Blocked',
};
