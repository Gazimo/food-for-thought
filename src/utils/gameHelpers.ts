import { Dish } from "../../public/data/dishes";

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
  // Convert degrees to radians
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1Rad = toRad(lat1);
  const lon1Rad = toRad(lon1);
  const lat2Rad = toRad(lat2);
  const lon2Rad = toRad(lon2);

  const y = Math.sin(lon2Rad - lon1Rad) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  const direction = (bearing + 360) % 360;
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(direction / 45) % 8];
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

export async function loadCountryCoords() {
  const response = await fetch("/data/countries.json");
  const data = await response.json();
  return data;
}

export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function loadDishes(): Promise<Dish[]> {
  const res = await fetch("/data/sample_dishes.json");
  if (!res.ok) throw new Error("Failed to load dishes");

  const allDishes = await res.json();
  const today = new Date().toISOString().split("T")[0];
  const todayDish = allDishes.find((dish: any) => dish.releaseDate === today);

  return todayDish ? [todayDish] : [];
}