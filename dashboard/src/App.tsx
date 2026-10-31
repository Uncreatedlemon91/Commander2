import { useCallback, useEffect, useMemo, useState } from 'react';
import { Home } from './components/Home';
import { ProjectView, TABS, type Tab } from './components/ProjectView';
import { SettingsView } from './components/SettingsView';
import { DemoSource } from './demo';
import { GitHubSource } from './github';
import { isConfigured, loadSettings, saveSettings, type Settings } from './settings';
import type { DataSource, Project, ProjectRef } from './types';

export type LoadState = { status: 'loading' } | { status: 'ok'; project: Project } | { status: 'error'; error: string };

type Route =
  | { page: 'home' }
  | { page: 'settings' }
  | { page: 'project'; repo: string; tab: Tab; taskId?: string };

function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'settings') return { page: 'settings' };
  if (parts[0] === 'p' && parts.length >= 3) {
    const tab = (TABS as readonly string[]).includes(parts[3] ?? '') ? (parts[3] as Tab) : 'overview';
    return { page: 'project', repo: `${parts[1]}/${parts[2]}`, tab, taskId: parts[4] };
  }
  return { page: 'home' };
}

function useHashRoute(): Route {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return useMemo(() => parseRoute(hash), [hash]);
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const route = useHashRoute();
  const useDemo = settings.demo || !isConfigured(settings);

  const source: DataSource = useMemo(
    () => (useDemo ? new DemoSource() : new GitHubSource(settings.token, settings.hubRepo, settings.hubBranch)),
    [useDemo, settings.token, settings.hubRepo, settings.hubBranch],
  );

  const [refs, setRefs] = useState<ProjectRef[]>([]);
  const [listError, setListError] = useState('');
  const [states, setStates] = useState<Map<string, LoadState>>(new Map());
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    setListError('');
    try {
      const list = await source.listProjects();
      setRefs(list);
      setStates((prev) => new Map(list.map((r) => [r.repo, prev.get(r.repo) ?? { status: 'loading' }])));
      await Promise.all(
        list.map(async (r) => {
          let next: LoadState;
          try {
            next = { status: 'ok', project: await source.loadProject(r) };
          } catch (e) {
            next = { status: 'error', error: errorText(e) };
          }
          setStates((prev) => new Map(prev).set(r.repo, next));
        }),
      );
      setUpdatedAt(new Date());
    } catch (e) {
      setListError(errorText(e));
      setRefs([]);
    } finally {
      setRefreshing(false);
    }
  }, [source]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = (s: Settings) => {
    saveSettings(s);
    setSettings(s);
    setStates(new Map());
    location.hash = '#/';
  };

  const projectState = route.page === 'project' ? states.get(route.repo) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          <img src="icon.svg" alt="" width={24} height={24} />
          Project Hub
        </a>
        {useDemo && (
          <a href="#/settings" className="tag demo-tag" title="Showing sample data. Connect GitHub in Settings.">
            Demo
          </a>
        )}
        <span className="spacer" />
        <button className="btn btn-small" onClick={() => void load()} disabled={refreshing} title={updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : undefined}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
        <a href="#/settings" className="btn btn-small" aria-label="Settings">
          ⚙
        </a>
      </header>

      <main>
        {listError && route.page !== 'settings' && (
          <div className="card error-box">
            <strong>Couldn't load the project list.</strong>
            <p>{listError}</p>
            <a href="#/settings" className="btn">Check settings</a>
          </div>
        )}
        {route.page === 'settings' && <SettingsView settings={settings} onSave={onSave} />}
        {route.page === 'home' && !listError && <Home source={source} refs={refs} states={states} />}
        {route.page === 'project' &&
          (projectState?.status === 'ok' ? (
            <ProjectView source={source} project={projectState.project} tab={route.tab} taskId={route.taskId} />
          ) : projectState?.status === 'error' ? (
            <div className="card error-box">
              <strong>{route.repo}</strong>
              <p>{projectState.error}</p>
            </div>
          ) : refreshing || projectState ? (
            <p className="muted">Loading…</p>
          ) : (
            <p className="muted">{route.repo} isn't in projects.json.</p>
          ))}
      </main>
    </div>
  );
}
