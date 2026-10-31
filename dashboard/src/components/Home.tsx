import { ATTENTION_LABEL, attentionFor, type AttentionItem } from '../attention';
import type { DataSource, Project, ProjectRef, TaskStatus } from '../types';
import { CiDot, Empty, ExternalLink, Markdown, MediaView } from './ui';
import type { LoadState } from '../App';

export const projectHash = (p: { repo: string }, tab = '', extra = '') =>
  `#/p/${p.repo}${tab ? `/${tab}` : ''}${extra ? `/${extra}` : ''}`;

function AttentionRow({ item, showProject }: { item: AttentionItem; showProject: boolean }) {
  const label = <span className={`tag k-${item.kind}`}>{ATTENTION_LABEL[item.kind]}</span>;
  const body = (
    <>
      {label}
      <span className="att-text">{item.text}</span>
      {showProject && <span className="att-proj">{item.project.meta.name}</span>}
    </>
  );
  if (item.url) return <ExternalLink href={item.url} className="att-row">{body}</ExternalLink>;
  const hash = item.taskId ? projectHash(item.project.ref, 'board', item.taskId) : projectHash(item.project.ref, 'inbox');
  return <a href={hash} className="att-row">{body}</a>;
}

export function AttentionList({ items, showProject }: { items: AttentionItem[]; showProject: boolean }) {
  if (items.length === 0) return <Empty>Nothing is waiting on you.</Empty>;
  return (
    <div className="att-list">
      {items.map((it, i) => (
        <AttentionRow key={i} item={it} showProject={showProject} />
      ))}
    </div>
  );
}

const COUNTED: TaskStatus[] = ['ready', 'in-progress', 'review', 'blocked'];

function ProjectCard({ source, project }: { source: DataSource; project: Project }) {
  const { meta } = project;
  const counts = COUNTED.map((s) => [s, project.tasks.filter((t) => t.status === s).length] as const).filter(([, n]) => n > 0);
  const done = project.tasks.filter((t) => t.status === 'done').length;
  const lastLog = project.devlog[0];
  const cover = project.media[0];
  return (
    <article className="card project-card">
      <a href={projectHash(project.ref)} className="card-link" aria-label={`Open ${meta.name}`} />
      {cover && (
        <div className="cover">
          <MediaView source={source} project={project} file={cover} thumb />
        </div>
      )}
      <div className="card-body">
        <div className="card-head">
          <h3>{meta.name}</h3>
          {meta.status !== 'active' && <span className="tag">{meta.status}</span>}
        </div>
        {meta.tagline && <p className="tagline">{meta.tagline}</p>}
        <div className="facts">
          {meta.milestone && <span>Milestone {meta.milestone}</span>}
          {meta.engine && <span>{meta.engine}</span>}
          <CiDot state={project.ci} />
        </div>
        {!project.hasKit && <p className="warn">No PROJECT/ folder. Install the kit (kit/install.sh).</p>}
        {project.tasks.length > 0 && (
          <div className="counts">
            {counts.map(([s, n]) => (
              <span key={s} className={`count st-${s}`}>
                {n} {s.replace('-', ' ')}
              </span>
            ))}
            <span className="count">
              {done}/{project.tasks.length} done
            </span>
          </div>
        )}
        {lastLog && (
          <p className="last-log">
            Last session {lastLog.date}
          </p>
        )}
        {meta.playUrl && (
          <ExternalLink href={meta.playUrl} className="btn btn-play">
            ▶ Play latest build
          </ExternalLink>
        )}
      </div>
    </article>
  );
}

export function Home({ source, refs, states }: { source: DataSource; refs: ProjectRef[]; states: Map<string, LoadState> }) {
  const loaded = refs.flatMap((r) => {
    const s = states.get(r.repo);
    return s?.status === 'ok' ? [s.project] : [];
  });
  const attention = loaded.flatMap(attentionFor);
  const feed = loaded
    .flatMap((p) => p.devlog.slice(0, 5).map((e) => ({ p, e })))
    .sort((a, b) => b.e.date.localeCompare(a.e.date))
    .slice(0, 8);

  return (
    <div className="home">
      <section>
        <h2>
          Needs you <span className="count-badge">{attention.length}</span>
        </h2>
        <AttentionList items={attention} showProject={loaded.length > 1} />
      </section>

      <section>
        <h2>Projects</h2>
        <div className="grid">
          {refs.map((r) => {
            const s = states.get(r.repo);
            if (s?.status === 'ok') return <ProjectCard key={r.repo} source={source} project={s.project} />;
            return (
              <article key={r.repo} className="card project-card">
                <div className="card-body">
                  <h3>{r.repo}</h3>
                  {s?.status === 'error' ? <p className="error">{s.error}</p> : <p className="muted">Loading…</p>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Recent sessions</h2>
        {feed.length === 0 ? (
          <Empty>No devlog entries yet.</Empty>
        ) : (
          <div className="feed">
            {feed.map(({ p, e }) => (
              <div key={`${p.ref.repo}/${e.path}`} className="feed-item card">
                <div className="feed-head">
                  <a href={projectHash(p.ref, 'devlog')}>
                    <strong>{p.meta.name}</strong>
                  </a>
                  <span className="muted">{e.date}</span>
                </div>
                <Markdown text={e.body} className="clamp" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
