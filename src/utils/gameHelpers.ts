export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateDirection(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const direction = (bearing + 360) % 360;
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
  return directions[Math.round(direction / 45)];
}

export function normalizeString(str: string) {
  return str.trim().toLowerCase();
}

export function isDishGuessCorrect(
  guess: string,
  dish: { name: string; acceptableGuesses?: string[] }
) {
  const normalizedGuess = normalizeString(guess);
  const possibleAnswers = [
    normalizeString(dish.name),
    ...(dish.acceptableGuesses?.map(normalizeString) || []),
  ];
  return possibleAnswers.includes(normalizedGuess);
}
