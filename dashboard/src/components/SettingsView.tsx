import { useState } from 'react';
import { clearBlobCache } from '../github';
import type { Settings } from '../settings';

export function SettingsView({ settings, onSave }: { settings: Settings; onSave: (s: Settings) => void }) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [cleared, setCleared] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <form
      className="settings card"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...draft, token: draft.token.trim(), hubRepo: draft.hubRepo.trim(), hubBranch: draft.hubBranch.trim() });
      }}
    >
      <h2>Settings</h2>

      <label className="check">
        <input type="checkbox" checked={draft.demo} onChange={(e) => set('demo', e.target.checked)} />
        Demo mode (sample data, no GitHub access)
      </label>

      <fieldset disabled={draft.demo}>
        <label>
          Hub repository
          <input
            value={draft.hubRepo}
            onChange={(e) => set('hubRepo', e.target.value)}
            placeholder="owner/repo"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <small>The repo holding <code>projects.json</code>, which lists the project repos to show.</small>
        </label>
        <label>
          Hub branch <span className="muted">(optional)</span>
          <input value={draft.hubBranch} onChange={(e) => set('hubBranch', e.target.value)} placeholder="default branch" autoCapitalize="off" />
        </label>
        <label>
          GitHub token
          <input
            type="password"
            value={draft.token}
            onChange={(e) => set('token', e.target.value)}
            placeholder="github_pat_…"
            autoComplete="off"
          />
          <small>
            Create a{' '}
            <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer noopener">
              fine-grained token
            </a>{' '}
            with access to the hub and project repos, and these <strong>read-only</strong> permissions: Contents, Pull requests, Actions,
            Metadata. It's stored only in this browser and sent only to api.github.com.
          </small>
        </label>
      </fieldset>

      <div className="actions">
        <button type="submit" className="btn btn-primary">Save</button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            clearBlobCache();
            setCleared(true);
          }}
        >
          {cleared ? 'Cache cleared' : 'Clear file cache'}
        </button>
      </div>
    </form>
  );
}
