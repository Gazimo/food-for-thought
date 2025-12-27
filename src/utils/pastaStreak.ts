export const PASTA_STREAK_KEY = "pasta-streak";
export const PASTA_LAST_PLAYED_KEY = "pasta-last-played";
export const PASTA_BEST_STREAK_KEY = "pasta-best-streak";

export function getPastaStreak(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(PASTA_STREAK_KEY) || 0);
}

export function getPastaBestStreak(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(PASTA_BEST_STREAK_KEY) || 0);
}

export function updatePastaBestStreak(currentStreak: number): void {
  if (typeof window === "undefined") return;

  const bestStreak = getPastaBestStreak();
  if (currentStreak > bestStreak) {
    localStorage.setItem(PASTA_BEST_STREAK_KEY, String(currentStreak));
  }
}

export function calculateBestStreakFromDates(dates: string[]): number {
  if (dates.length === 0) return 0;
  if (dates.length === 1) return 1;

  const sortedDates = [...dates].sort();

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export function updatePastaStreak(): number {
  if (typeof window === "undefined") return 0;

  const today = new Date().toISOString().split("T")[0];
  const lastPlayed = localStorage.getItem(PASTA_LAST_PLAYED_KEY);

  if (lastPlayed === today) return getPastaStreak();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const currentStreak = getPastaStreak();
  const newStreak = lastPlayed === yesterdayStr ? currentStreak + 1 : 1;

  localStorage.setItem(PASTA_STREAK_KEY, String(newStreak));
  localStorage.setItem(PASTA_LAST_PLAYED_KEY, today);

  updatePastaBestStreak(newStreak);

  return newStreak;
}

export function alreadyPlayedPastaToday(): boolean {
  if (typeof window === "undefined") return false;
  const today = new Date().toISOString().split("T")[0];
  return localStorage.getItem(PASTA_LAST_PLAYED_KEY) === today;
}
