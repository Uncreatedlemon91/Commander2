export interface Settings {
  token: string;
  hubRepo: string;
  hubBranch: string;
  demo: boolean;
}

const KEY = 'hub.settings';

export const DEFAULT_SETTINGS: Settings = {
  token: '',
  hubRepo: import.meta.env.VITE_HUB_REPO ?? '',
  hubBranch: '',
  demo: true,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    // Private mode or corrupt value: fall back to defaults.
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Not persisted. Still applies for this visit.
  }
}

export const isConfigured = (s: Settings): boolean => Boolean(s.token && s.hubRepo.includes('/'));
