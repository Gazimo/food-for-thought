/**
 * Pasta Game Validators
 *
 * Phase-specific validation logic for the Italian Pasta game.
 * These validators can be registered with the PhaseEngine for custom validation.
 */

import { PhaseConfig } from "@/config/games/types";
import { GuessValidationResult } from "@/engine/PhaseEngine";
import { Pasta, RegionGuessResult, ITALIAN_REGIONS } from "@/types/pasta";
import { normalizeForComparison } from "@/utils/stringNormalization";
import { normalizeRegionForComparison } from "@/utils/italyColors";
import debugLogger from "@/utils/debugLogger";

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate compass direction from one point to another
 */
function calculateDirection(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): string {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);

  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  // Convert to 8-point compass
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45) % 8;

  return directions[index];
}

/**
 * Validate pasta guess (text with acceptable guesses)
 */
export function validatePastaGuess(
  guess: string | number,
  pasta: Pasta
): GuessValidationResult {
  const guessStr = String(guess);
  const acceptableGuesses = pasta.acceptableGuesses || [];
  const normalizedGuess = normalizeForComparison(guessStr);

  debugLogger.validation('Validating pasta guess', {
    guess: guessStr,
    normalizedGuess,
    acceptableGuessesCount: acceptableGuesses.length,
  });

  const isCorrect = acceptableGuesses.some(
    (acceptable) => normalizeForComparison(acceptable) === normalizedGuess
  );

  debugLogger.validation(isCorrect ? '✅ Match found' : '❌ No match', {
    guess: guessStr,
    isCorrect,
  });

  return { isCorrect };
}

/**
 * Validate sauce guess (text with sauce acceptable guesses)
 */
export function validateSauceGuess(
  guess: string | number,
  pasta: Pasta
): GuessValidationResult {
  const guessStr = String(guess);
  const acceptableGuesses = pasta.sauceAcceptableGuesses || [];
  const normalizedGuess = normalizeForComparison(guessStr);

  debugLogger.validation('Validating sauce guess', {
    guess: guessStr,
    normalizedGuess,
    acceptableGuessesCount: acceptableGuesses.length,
  });

  const isCorrect = acceptableGuesses.some(
    (acceptable) => normalizeForComparison(acceptable) === normalizedGuess
  );

  debugLogger.validation(isCorrect ? '✅ Match found' : '❌ No match', {
    guess: guessStr,
    isCorrect,
  });

  return { isCorrect };
}

/**
 * Validate region guess with distance/direction feedback
 */
export function validateRegionGuess(
  guess: string | number,
  pasta: Pasta
): GuessValidationResult {
  const guessStr = String(guess);
  const correctRegion = pasta.region;
  const correctCoords = pasta.regionCoordinates;

  debugLogger.validation('Validating region guess', {
    guess: guessStr,
    correctRegion,
    hasCoordinates: !!(guessStr && correctCoords),
  });

  // Check if guess is correct
  const isCorrect =
    normalizeForComparison(guessStr) === normalizeForComparison(correctRegion);

  // Get guess coordinates with normalized lookup
  const guessRegionEntry = Object.entries(ITALIAN_REGIONS).find(
    ([regionName]) =>
      normalizeRegionForComparison(regionName) ===
      normalizeRegionForComparison(guessStr)
  );
  const guessCoords = guessRegionEntry?.[1];

  if (!guessCoords || !correctCoords) {
    debugLogger.validation(isCorrect ? '✅ Correct region (no coordinates)' : '❌ Wrong region (no coordinates)', {
      guess: guessStr,
      isCorrect,
      hasGuessCoords: !!guessCoords,
      hasCorrectCoords: !!correctCoords,
    });
    return { isCorrect };
  }

  // Calculate distance and direction
  const distance = calculateDistance(
    guessCoords.lat,
    guessCoords.lng,
    correctCoords.lat,
    correctCoords.lng
  );

  const direction = calculateDirection(
    guessCoords.lat,
    guessCoords.lng,
    correctCoords.lat,
    correctCoords.lng
  );

  debugLogger.validation(isCorrect ? '✅ Correct region' : '❌ Wrong region', {
    guess: guessStr,
    correctRegion,
    distance,
    direction,
    isCorrect,
  });

  const result: RegionGuessResult = {
    region: guessStr,
    distance,
    direction,
    isCorrect,
  };

  return {
    isCorrect,
    resultData: result,
  };
}

/**
 * Validate protein guess with exact match (following F4T)
 */
export function validateProteinGuess(
  guess: string | number,
  pasta: Pasta,
  tolerance: number = 0 // Default to 0 (exact match like F4T)
): GuessValidationResult {
  const guessNum = Number(guess);
  const actualValue = pasta.proteinPerServing || 0;
  const difference = Math.abs(guessNum - actualValue);
  const isCorrect = difference <= tolerance;

  debugLogger.validation('Validating protein guess', {
    guess: guessNum,
    actualProtein: actualValue,
    tolerance,
    difference,
    isCorrect,
  });

  return {
    isCorrect,
    resultData: {
      guess: guessNum,
      actualProtein: actualValue,
      difference,
      isCorrect,
    },
  };
}
