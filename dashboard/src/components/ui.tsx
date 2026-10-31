import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';
import type { CiState, DataSource, MediaFile, Project, TaskStatus } from '../types';

export function Markdown({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(text, { async: false, gfm: true }) as string;
    return DOMPurify.sanitize(raw);
  }, [text]);
  return <div className={`md ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  inbox: 'Inbox',
  backlog: 'Backlog',
  ready: 'Ready',
  'in-progress': 'In progress',
  review: 'Review',
  blocked: 'Blocked',
  done: 'Done',
};

export function StatusPill({ status }: { status: TaskStatus }) {
  return <span className={`pill st-${status}`}>{STATUS_LABEL[status]}</span>;
}

const CI_LABEL: Record<CiState, string> = { success: 'CI passing', failure: 'CI failing', pending: 'CI running', none: 'No CI' };

export function CiDot({ state }: { state: CiState }) {
  if (state === 'none') return null;
  return (
    <span className={`ci ci-${state}`} title={CI_LABEL[state]}>
      <span className="ci-dot" aria-hidden="true" />
      {CI_LABEL[state]}
    </span>
  );
}

export function ExternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={className}>
      {children}
    </a>
  );
}

/** Lazily resolves a media file to a displayable URL (object URLs in GitHub mode). */
export function MediaView({ source, project, file, thumb }: { source: DataSource; project: Project; file: MediaFile; thumb?: boolean }) {
  const [url, setUrl] = useState<string>('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    setUrl('');
    setFailed(false);
    source.mediaUrl(project, file).then(
      (u) => live && setUrl(u),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [source, project, file]);

  if (failed) return <div className="media-ph">Couldn't load {file.name}</div>;
  if (!url) return <div className="media-ph" aria-busy="true" />;
  if (file.kind === 'video')
    return <video src={url} controls={!thumb} muted playsInline loop autoPlay={thumb} preload="metadata" />;
  return <img src={url} alt={file.name} loading="lazy" />;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}
