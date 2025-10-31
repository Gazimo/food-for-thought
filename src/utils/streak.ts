export const STREAK_KEY = "fft-streak";
export const LAST_PLAYED_KEY = "fft-last-played";
export const BEST_STREAK_KEY = "fft-best-streak";

export function getStreak(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(STREAK_KEY) || 0);
}

export function getBestStreak(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(BEST_STREAK_KEY) || 0);
}

export function updateBestStreak(currentStreak: number): void {
  if (typeof window === "undefined") return;
  
  const bestStreak = getBestStreak();
  if (currentStreak > bestStreak) {
    localStorage.setItem(BEST_STREAK_KEY, String(currentStreak));
  }
}

/**
 * Calculate best streak from an array of dates
 * Dates should be in YYYY-MM-DD format
 */
export function calculateBestStreakFromDates(dates: string[]): number {
  if (dates.length === 0) return 0;
  if (dates.length === 1) return 1;

  // Sort dates
  const sortedDates = [...dates].sort();
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    
    // Calculate difference in days
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      // Consecutive day
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      // Gap in streak
      currentStreak = 1;
    }
    // If diffDays === 0, same day, don't change streak
  }
  
  return maxStreak;
}

export function updateStreak(): number {
  if (typeof window === "undefined") return 0;

  const today = new Date().toISOString().split("T")[0];
  const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);

  if (lastPlayed === today) return getStreak();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const currentStreak = getStreak();
  const newStreak = lastPlayed === yesterdayStr ? currentStreak + 1 : 1;

  localStorage.setItem(STREAK_KEY, String(newStreak));
  localStorage.setItem(LAST_PLAYED_KEY, today);
  
  // Update best streak if current is higher
  updateBestStreak(newStreak);
  
  return newStreak;
}

export function alreadyPlayedToday(): boolean {
  if (typeof window === "undefined") return false;
  const today = new Date().toISOString().split("T")[0];
  return localStorage.getItem(LAST_PLAYED_KEY) === today;
}
