import Fuse from "fuse.js";
import { Dish } from "../../public/data/dishes";
import { deobfuscateData } from "./encryption";

// Type for the sensitive data that gets encrypted/decrypted
interface SensitiveData {
  name: string;
  country: string;
  acceptableGuesses: string[];
  proteinPerServing?: number;
  ingredients: string[];
  recipe: {
    ingredients: string[];
    instructions: string[];
  };
  blurb: string;
  imageUrl: string;
  releaseDate?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

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
  console.log("🔍 Loading dishes from API...");
  const res = await fetch("/api/dishes");
  if (!res.ok) {
    console.error("❌ Failed to fetch dishes:", res.status, res.statusText);
    throw new Error("Failed to load dishes");
  }

  const obfuscatedDishes = await res.json();
  console.log("📦 Received obfuscated dishes:", obfuscatedDishes.length);

  if (!obfuscatedDishes || obfuscatedDishes.length === 0) {
    console.warn("⚠️ No dishes received from API");
    return [];
  }

  // Server now returns only today's dish, so just use the first one
  const todayObfuscatedDish = obfuscatedDishes[0];

  console.log("🔍 Processing dish:", {
    hasEncrypted: !!todayObfuscatedDish._encrypted,
    hasSalt: !!todayObfuscatedDish._salt,
    hasCoordinates: !!todayObfuscatedDish.coordinates,
  });

  // Deobfuscate the sensitive data
  const sensitiveData = deobfuscateData<SensitiveData>(
    todayObfuscatedDish._encrypted,
    todayObfuscatedDish._salt
  );

  if (!sensitiveData) {
    console.error("❌ Failed to deobfuscate dish data");
    return [];
  }

  console.log("🔓 Successfully deobfuscated data:", {
    name: sensitiveData.name,
    country: sensitiveData.country,
    hasIngredients: !!sensitiveData.ingredients,
    hasRecipe: !!sensitiveData.recipe,
    hasImageUrl: !!sensitiveData.imageUrl,
    releaseDate: sensitiveData.releaseDate,
  });

  // Reconstruct the complete dish object
  const completeDish: Dish = {
    ...todayObfuscatedDish,
    name: sensitiveData.name,
    country: sensitiveData.country,
    acceptableGuesses: sensitiveData.acceptableGuesses,
    proteinPerServing: sensitiveData.proteinPerServing,
    ingredients: sensitiveData.ingredients,
    recipe: sensitiveData.recipe,
    blurb: sensitiveData.blurb,
    // Extract imageUrl and releaseDate from sensitive data
    imageUrl: sensitiveData.imageUrl,
    releaseDate: sensitiveData.releaseDate,
    // Extract coordinates from sensitive data
    coordinates: sensitiveData.coordinates,
  };

  // Clean up the encrypted fields
  delete (
    completeDish as Dish & {
      _encrypted?: string;
      _salt?: string;
      _checksum?: string;
    }
  )._encrypted;
  delete (
    completeDish as Dish & {
      _encrypted?: string;
      _salt?: string;
      _checksum?: string;
    }
  )._salt;
  delete (
    completeDish as Dish & {
      _encrypted?: string;
      _salt?: string;
      _checksum?: string;
    }
  )._checksum;

  console.log("✅ Complete dish ready:", {
    name: completeDish.name,
    country: completeDish.country,
    imageUrl: completeDish.imageUrl,
    coordinates: completeDish.coordinates,
  });

  return [completeDish];
}

export function getClosestGuess(
  input: string,
  options: string[]
): string | null {
  const fuse = new Fuse(options, {
    threshold: 0.2,
    includeScore: true,
  });
  const result = fuse.search(input);
  return result.length > 0 ? result[0].item : null;
}
