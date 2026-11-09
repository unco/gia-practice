const KEY = 'gia-practice-history-v1';
const SETTINGS_KEY = 'gia-practice-settings-v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadHistory = () => read(KEY, []);
export const saveAttempt = (attempt) => {
  const all = loadHistory();
  all.push(attempt);
  write(KEY, all.slice(-100));
};
export const clearHistory = () => write(KEY, []);

export const loadSettings = () => read(SETTINGS_KEY, { preset: 'full', practice: true });
export const saveSettings = (s) => write(SETTINGS_KEY, s);

export function scoreSection(result, penalty) {
  const wrong = result.attempted - result.correct;
  return {
    ...result,
    wrong,
    accuracy: result.attempted ? Math.round((result.correct / result.attempted) * 100) : 0,
    adjusted: Math.round((result.correct - wrong * penalty) * 100) / 100
  };
}
