import { calculateDistance, calculateDirection } from "@/utils/gameHelpers";

export interface LocationGuessParams {
  guess: string;
  correctLocation: string;
  guessCoords: { lat: number; lng: number };
  correctCoords: { lat: number; lng: number };
  currentGuesses: any[];
  maxGuesses?: number | null;
}

export interface LocationGuessResult {
  isCorrect: boolean;
  shouldComplete: boolean;
  guessResult: {
    location: string;
    distance: number;
    direction: string;
    isCorrect: boolean;
  };
}

export function processLocationGuess(
  params: LocationGuessParams
): LocationGuessResult {
  const {
    guess,
    correctLocation,
    guessCoords,
    correctCoords,
    currentGuesses,
    maxGuesses = null,
  } = params;

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

  const isCorrect = guess.toLowerCase() === correctLocation.toLowerCase();

  const newGuessCount = currentGuesses.length + 1;

  let shouldComplete: boolean;
  if (maxGuesses === null || maxGuesses === undefined) {
    shouldComplete = isCorrect;
  } else {
    shouldComplete = isCorrect || newGuessCount >= maxGuesses;
  }

  return {
    isCorrect,
    shouldComplete,
    guessResult: {
      location: guess,
      distance,
      direction,
      isCorrect,
    },
  };
}
