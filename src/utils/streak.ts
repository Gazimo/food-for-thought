// utils/streak.ts

const STREAK_KEY = 'streak';
const LAST_PLAY_KEY = 'lastPlayedDate';

const getToday = () => new Date().toDateString();

export function getStreak() {
  const lastPlayed = localStorage.getItem(LAST_PLAY_KEY);
  const streak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);

  const today = getToday();

  if (!lastPlayed) {
    localStorage.setItem(LAST_PLAY_KEY, today);
    localStorage.setItem(STREAK_KEY, '1');
    return 1;
  }

  const lastDate = new Date(lastPlayed);
  const diff = (new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diff === 0) return streak; // already played today
  if (diff === 1) {
    const newStreak = streak + 1;
    localStorage.setItem(STREAK_KEY, newStreak.toString());
    localStorage.setItem(LAST_PLAY_KEY, today);
    return newStreak;
  }

  // missed a day → reset
  localStorage.setItem(STREAK_KEY, '1');
  localStorage.setItem(LAST_PLAY_KEY, today);
  return 1;
}
