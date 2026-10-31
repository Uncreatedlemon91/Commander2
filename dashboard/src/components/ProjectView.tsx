import { useEffect, useRef } from 'react';
import { attentionFor } from '../attention';
import { TASK_STATUSES, type DataSource, type Project, type Task } from '../types';
import { AttentionList, projectHash } from './Home';
import { CiDot, Empty, ExternalLink, Markdown, MediaView, STATUS_LABEL, StatusPill } from './ui';

export const TABS = ['overview', 'board', 'devlog', 'decisions', 'inbox', 'media', 'prs'] as const;
export type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  overview: 'Overview',
  board: 'Tasks',
  devlog: 'Devlog',
  decisions: 'Decisions',
  inbox: 'Inbox',
  media: 'Media',
  prs: 'PRs',
};

interface Props {
  source: DataSource;
  project: Project;
  tab: Tab;
  taskId?: string;
}

function GitHubFileLink({ source, project, path, edit }: { source: DataSource; project: Project; path: string; edit?: boolean }) {
  const url = source.fileUrl(project, path, edit);
  if (!url) return null;
  return (
    <ExternalLink href={url} className="btn btn-small">
      {edit ? 'Edit on GitHub' : 'View on GitHub'}
    </ExternalLink>
  );
}

function TaskCard({ project, task }: { project: Project; task: Task }) {
  return (
    <a className={`task-card${task.owner === 'human' ? ' human' : ''}`} href={projectHash(project.ref, 'board', task.id)}>
      <span className="task-id">{task.id}</span>
      <span className="task-title">{task.title}</span>
      <span className="task-meta">
        {task.milestone && <span>{task.milestone}</span>}
        {task.system && <span>{task.system}</span>}
        {task.owner === 'human' && <span className="tag k-human-task">You</span>}
        {task.pr && <span>PR</span>}
      </span>
    </a>
  );
}

function Board({ project }: { project: Project }) {
  if (project.tasks.length === 0) return <Empty>No tasks yet. Add files under PROJECT/tasks/.</Empty>;
  const columns = TASK_STATUSES.map((s) => ({ s, tasks: project.tasks.filter((t) => t.status === s) })).filter(
    (c) => c.tasks.length > 0 || ['ready', 'in-progress', 'review'].includes(c.s),
  );
  return (
    <div className="board">
      {columns.map(({ s, tasks }) => (
        <section key={s} className={`column st-${s}`}>
          <h3>
            {STATUS_LABEL[s]} <span className="muted">{tasks.length}</span>
          </h3>
          {tasks.map((t) => (
            <TaskCard key={t.path} project={project} task={t} />
          ))}
        </section>
      ))}
    </div>
  );
}

function TaskDetail({ source, project, task }: { source: DataSource; project: Project; task: Task }) {
  const ref = useRef<HTMLDialogElement>(null);
  const back = projectHash(project.ref, 'board');
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, [task]);
  return (
    <dialog
      ref={ref}
      className="task-dialog"
      onClose={() => {
        if (location.hash !== back) location.hash = back;
      }}
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <div className="dialog-inner">
        <header>
          <span className="task-id">{task.id}</span>
          <StatusPill status={task.status} />
          <button className="btn btn-small close" onClick={() => ref.current?.close()} aria-label="Close">
            ✕
          </button>
        </header>
        <h2>{task.title}</h2>
        <dl className="kv">
          {task.milestone && (<><dt>Milestone</dt><dd>{task.milestone}</dd></>)}
          {task.system && (<><dt>System</dt><dd>{task.system}</dd></>)}
          <dt>Owner</dt>
          <dd>{task.owner === 'human' ? 'You' : task.owner}</dd>
          {task.pr && (<><dt>PR</dt><dd><ExternalLink href={task.pr}>{task.pr.replace(/^https?:\/\/github\.com\//, '')}</ExternalLink></dd></>)}
        </dl>
        {task.doneWhen.length > 0 && (
          <>
            <h3>Done when</h3>
            <ul className="checklist">
              {task.doneWhen.map((d, i) => (
                <li key={i} className={task.status === 'done' ? 'checked' : ''}>{d}</li>
              ))}
            </ul>
          </>
        )}
        {task.context.length > 0 && (
          <>
            <h3>Context Claude loads</h3>
            <ul className="context">
              {task.context.map((c, i) => (
                <li key={i}><code>{c}</code></li>
              ))}
            </ul>
          </>
        )}
        {task.body && (
          <>
            <h3>Notes</h3>
            <Markdown text={task.body} />
          </>
        )}
        <div className="actions">
          <GitHubFileLink source={source} project={project} path={task.path} edit />
        </div>
      </div>
    </dialog>
  );
}

function Devlog({ source, project }: Props) {
  if (project.devlog.length === 0) return <Empty>No devlog entries yet.</Empty>;
  return (
    <div className="feed">
      {project.devlog.map((e) => {
        const media = e.media.flatMap((m) => project.media.filter((f) => f.name === m));
        return (
          <article key={e.path} className="card feed-item">
            <div className="feed-head">
              <strong>{e.date}</strong>
              <span className="chips">
                {e.tasks.map((t) => (
                  <a key={t} className="chip" href={projectHash(project.ref, 'board', t)}>{t}</a>
                ))}
                {e.pr && <ExternalLink href={e.pr} className="chip">PR</ExternalLink>}
              </span>
            </div>
            <Markdown text={e.body} />
            {media.length > 0 && (
              <div className="media-strip">
                {media.map((f) => (
                  <MediaView key={f.path} source={source} project={project} file={f} />
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function Decisions({ project }: { project: Project }) {
  if (project.decisions.length === 0) return <Empty>No decisions recorded yet.</Empty>;
  return (
    <div className="feed">
      {project.decisions.map((d) => (
        <details key={d.path} className="card decision" open={d.status === 'proposed'}>
          <summary>
            <span className="task-id">{d.id}</span>
            <span className="decision-title">{d.title}</span>
            <span className={`tag d-${d.status}`}>{d.status}</span>
          </summary>
          <Markdown text={d.body} />
          {(d.date || d.source) && <p className="muted small">{[d.date, d.source].filter(Boolean).join(' · ')}</p>}
        </details>
      ))}
    </div>
  );
}

function Media({ source, project }: Props) {
  if (project.media.length === 0) return <Empty>No screenshots or clips yet. Claude saves them to PROJECT/media/.</Empty>;
  return (
    <div className="gallery">
      {project.media.map((f) => (
        <figure key={f.path}>
          <MediaView source={source} project={project} file={f} />
          <figcaption>{f.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Prs({ project }: { project: Project }) {
  return (
    <div className="feed">
      <p>
        <CiDot state={project.ci} /> <span className="muted">on {project.branch}</span>
      </p>
      {project.prs.length === 0 ? (
        <Empty>No open pull requests.</Empty>
      ) : (
        project.prs.map((pr) => (
          <ExternalLink key={pr.number} href={pr.url} className="card pr-row">
            <span className="task-id">#{pr.number}</span>
            <span className="task-title">{pr.title}</span>
            <span className="task-meta">
              {pr.draft && <span className="tag">Draft</span>}
              <CiDot state={pr.ci} />
              <span>{pr.author}</span>
              <span>{new Date(pr.updatedAt).toLocaleDateString()}</span>
            </span>
          </ExternalLink>
        ))
      )}
    </div>
  );
}

export function ProjectView({ source, project, tab, taskId }: Props) {
  const { meta } = project;
  const attention = attentionFor(project);
  const task = taskId ? project.tasks.find((t) => t.id === taskId) : undefined;

  return (
    <div className="project">
      <header className="project-head">
        <div>
          <h2>{meta.name}</h2>
          {meta.tagline && <p className="tagline">{meta.tagline}</p>}
          <div className="facts">
            {meta.milestone && <span>Milestone {meta.milestone}</span>}
            {meta.engine && <span>{meta.engine}</span>}
            <span>{meta.status}</span>
            <CiDot state={project.ci} />
          </div>
        </div>
        <div className="head-actions">
          {meta.playUrl && <ExternalLink href={meta.playUrl} className="btn btn-play">▶ Play</ExternalLink>}
          <ExternalLink href={project.htmlUrl} className="btn">Repo</ExternalLink>
        </div>
      </header>

      <nav className="tabs" aria-label="Project sections">
        {TABS.map((t) => (
          <a key={t} href={projectHash(project.ref, t)} className={t === tab ? 'active' : ''} aria-current={t === tab ? 'page' : undefined}>
            {TAB_LABEL[t]}
            {t === 'prs' && project.prs.length > 0 && <span className="count-badge">{project.prs.length}</span>}
            {t === 'inbox' && project.inbox.some((i) => !i.checked) && (
              <span className="count-badge">{project.inbox.filter((i) => !i.checked).length}</span>
            )}
          </a>
        ))}
      </nav>

      {tab === 'overview' && (
        <div className="overview">
          {attention.length > 0 && (
            <section>
              <h3>Needs you</h3>
              <AttentionList items={attention} showProject={false} />
            </section>
          )}
          {!project.hasKit && <p className="warn">This repo has no PROJECT/ folder. Run kit/install.sh from the hub repo.</p>}
          {project.overview && <Markdown text={project.overview} className="card" />}
          {project.roadmap && <Markdown text={project.roadmap} className="card" />}
        </div>
      )}
      {tab === 'board' && <Board project={project} />}
      {tab === 'devlog' && <Devlog source={source} project={project} tab={tab} />}
      {tab === 'decisions' && <Decisions project={project} />}
      {tab === 'inbox' && (
        <div className="overview">
          <div className="actions">
            <GitHubFileLink source={source} project={project} path="inbox.md" edit />
          </div>
          {project.inboxRaw ? <Markdown text={project.inboxRaw} className="card" /> : <Empty>No inbox.md.</Empty>}
        </div>
      )}
      {tab === 'media' && <Media source={source} project={project} tab={tab} />}
      {tab === 'prs' && <Prs project={project} />}

      {tab === 'board' && task && <TaskDetail key={task.id} source={source} project={project} task={task} />}
    </div>
  );
}
