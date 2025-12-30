import { getCountryCoordsMap, getCountryNames } from "@/utils/countries";
import { processLocationGuess } from "@/store/utils/locationGuessLogic";
import { normalizeForComparison } from "@/utils/stringNormalization";

const countryCoords = getCountryCoordsMap();
const countryNames = getCountryNames();

export const validateDishGuess = (guess: string, dish: any): boolean => {
  const normalized = guess.toLowerCase().trim();
  return (
    dish.acceptableGuesses?.some(
      (acceptable: string) => acceptable.toLowerCase() === normalized
    ) || dish.name.toLowerCase() === normalized
  );
};

export const validateCountryGuess = (guess: string, dish: any) => {
  const normalized = guess.toLowerCase();
  const coords = countryCoords[normalized];

  // Find the properly capitalized country name from the countries list
  const properCountryName = countryNames.find(
    (name) => normalizeForComparison(name) === normalizeForComparison(guess)
  ) || guess;

  if (!coords) {
    return {
      isCorrect: false,
      resultData: {
        country: properCountryName,
        isCorrect: false,
        distance: NaN,
        direction: "Invalid",
      },
    };
  }

  const result = processLocationGuess({
    guess: normalized,
    correctLocation: dish.country,
    guessCoords: coords,
    correctCoords: dish.coordinates || { lat: 0, lng: 0 },
    currentGuesses: [],
    maxGuesses: null,
  });

  return {
    isCorrect: result.isCorrect,
    resultData: {
      country: properCountryName,
      isCorrect: result.isCorrect,
      distance: result.guessResult.distance,
      direction: result.guessResult.direction,
    },
  };
};

export const validateProteinGuess = (guess: number, dish: any) => {
  const actualProtein = dish.proteinPerServing || 0;
  const isCorrect = guess === actualProtein;
  const difference = Math.abs(guess - actualProtein);

  return {
    isCorrect,
    resultData: {
      guess,
      actualProtein,
      difference,
      isCorrect,
    },
  };
};
