export const STREAK_KEY = "fft-streak";
export const LAST_PLAYED_KEY = "fft-last-played";

export function getStreak(): number {
  return Number(localStorage.getItem(STREAK_KEY) || 0);
}

export function updateStreak(): number {
  const today = new Date().toISOString().split("T")[0];
  const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);

  if (lastPlayed === today) return getStreak(); // Already counted today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const currentStreak = getStreak();
  const newStreak = lastPlayed === yesterdayStr ? currentStreak + 1 : 1;

  localStorage.setItem(STREAK_KEY, String(newStreak));
  localStorage.setItem(LAST_PLAYED_KEY, today);
  return newStreak;
}

export function alreadyPlayedToday(): boolean {
  const today = new Date().toISOString().split("T")[0];
  return localStorage.getItem(LAST_PLAYED_KEY) === today;
}
