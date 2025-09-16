import { emojiThemes, launchEmojiBurst } from "../../utils/celebration";
import { getCountryCoordsMap } from "../../utils/countries";
import {
  calculateDirection,
  calculateDistance,
  capitalizeFirst,
  isDishGuessCorrect,
  normalizeString,
} from "../../utils/gameHelpers";
import { GameSliceCreator, GuessSlice } from "../types/slices";

const countryCoords = getCountryCoordsMap();

function getSortedCountryCoords() {
  return Object.keys(countryCoords)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = countryCoords[key];
      return acc;
    }, {} as typeof countryCoords);
}

export const createGuessSlice: GameSliceCreator<GuessSlice> = (set, get) => ({
  dishGuesses: [],
  countryGuesses: [],
  proteinGuesses: [],
  countryGuessResults: [],
  proteinGuessResults: [],

  makeDishGuess: (guess) => {
    const { currentDish, gamePhase, loading } = get();
    if (!currentDish || loading.dishGuess) return false;

    try {
      get().setLoading("dishGuess", true);
      const normalizedGuess = normalizeString(guess);
      if (gamePhase === "dish") {
        const isCorrect = isDishGuessCorrect(normalizedGuess, currentDish);
        const newGuesses = [...get().dishGuesses, normalizedGuess];
        set((state) => ({
          dishGuesses: newGuesses,
          gameResults: {
            ...state.gameResults,
            dishGuesses: newGuesses,
            dishGuessSuccess: isCorrect,
          },
        }));
        get().saveCurrentGameState();
        return isCorrect;
      }
      return false;
    } finally {
      get().setLoading("dishGuess", false);
    }
  },

  makeCountryGuess: (guess) => {
    const { currentDish, gamePhase, loading } = get();
    if (!currentDish || loading.countryGuess) return false;

    try {
      get().setLoading("countryGuess", true);
      const normalizedGuess = normalizeString(guess);
      if (gamePhase === "country") {
        const isCorrect =
          normalizedGuess === normalizeString(currentDish.country);

        const newGuesses = [...get().countryGuesses, normalizedGuess];
        const results = get().countryGuessResults;
        const updatedResults = [...results];
        if (isCorrect) {
          updatedResults.push({
            country: capitalizeFirst(normalizedGuess),
            isCorrect: true,
            distance: 0,
            direction: "N/A",
          });
        } else {
          const coords = countryCoords[normalizedGuess];
          if (!coords) {
            updatedResults.push({
              country: capitalizeFirst(normalizedGuess),
              isCorrect: false,
              distance: NaN,
              direction: "Invalid",
            });
          } else {
            const distance = calculateDistance(
              coords.lat,
              coords.lng,
              currentDish.coordinates?.lat || 0,
              currentDish.coordinates?.lng || 0
            );
            const direction = calculateDirection(
              coords.lat,
              coords.lng,
              currentDish.coordinates?.lat || 0,
              currentDish.coordinates?.lng || 0
            );
            updatedResults.push({
              country: capitalizeFirst(normalizedGuess),
              isCorrect: false,
              distance,
              direction,
            });
          }
        }
        set((state) => ({
          countryGuesses: newGuesses,
          countryGuessResults: updatedResults,
          gameResults: {
            ...state.gameResults,
            countryGuesses: newGuesses,
            countryGuessSuccess: isCorrect,
          },
        }));
        get().saveCurrentGameState();
        return isCorrect;
      }
      return false;
    } finally {
      get().setLoading("countryGuess", false);
    }
  },

  makeProteinGuess: (guess) => {
    const { currentDish, gamePhase, loading } = get();
    if (!currentDish || gamePhase !== "protein" || loading.proteinGuess)
      return false;

    try {
      get().setLoading("proteinGuess", true);
      const actualProtein = currentDish.proteinPerServing || 0;
      const isCorrect = guess === actualProtein;
      const difference = Math.abs(guess - actualProtein);

      const newGuesses = [...get().proteinGuesses, guess];
      const results = get().proteinGuessResults;
      const updatedResults = [
        ...results,
        {
          guess,
          actualProtein,
          difference,
          isCorrect,
        },
      ];

      set((state) => ({
        proteinGuesses: newGuesses,
        proteinGuessResults: updatedResults,
        gameResults: {
          ...state.gameResults,
          proteinGuesses: newGuesses,
          proteinGuessSuccess: isCorrect,
        },
      }));
      get().saveCurrentGameState();

      return isCorrect;
    } finally {
      get().setLoading("proteinGuess", false);
    }
  },

  guessDish: (guess) => {
    const {
      currentDish,
      makeDishGuess,
      revealAllTiles,
      moveToCountryPhase,
      revealRandomTile,
      revealNextIngredient,
    } = get();
    if (!currentDish) return false;
    const isCorrect = makeDishGuess(guess);
    if (isCorrect) {
      if (typeof window !== "undefined") launchEmojiBurst(emojiThemes.dish);
      revealAllTiles();
      moveToCountryPhase();
    } else {
      const { dishGuesses, revealedIngredients } = get();
      const ingredientsLength = currentDish.ingredients.length || 0;
      if (dishGuesses.length >= 6) {
        revealAllTiles();
        moveToCountryPhase();
      } else {
        revealRandomTile();
        if (revealedIngredients < ingredientsLength) {
          revealNextIngredient();
        }
      }
    }
    return isCorrect;
  },

  guessCountry: (guess) => {
    const { currentDish, makeCountryGuess, moveToProteinPhase } = get();
    if (!currentDish || !currentDish.coordinates) return false;
    const isCorrect = makeCountryGuess(guess);
    if (isCorrect) {
      if (typeof window !== "undefined") launchEmojiBurst(emojiThemes.country);
      moveToProteinPhase();
    }
    return isCorrect;
  },

  guessProtein: (guess) => {
    const { currentDish, makeProteinGuess, completeGame } = get();
    if (!currentDish) return false;
    const isCorrect = makeProteinGuess(guess);
    if (isCorrect) {
      if (typeof window !== "undefined") launchEmojiBurst(emojiThemes.protein);
      completeGame();
    } else {
      const { proteinGuesses } = get();
      if (proteinGuesses.length >= 4) {
        completeGame();
      }
    }
    return isCorrect;
  },

  resetCountryGuesses: () => set({ countryGuessResults: [] }),

  resetProteinGuesses: () => set({ proteinGuessResults: [] }),

  revealCorrectCountry: () => {
    const { currentDish } = get();
    if (!currentDish || !currentDish.coordinates) return;

    const newGuesses = [
      ...get().countryGuesses,
      currentDish.country.toLowerCase(),
    ];
    const results = get().countryGuessResults;
    const updatedResults = [
      ...results,
      {
        country: currentDish.country,
        isCorrect: true,
        distance: 0,
        direction: "",
      },
    ];

    set(() => ({
      countryGuesses: newGuesses,
      countryGuessResults: updatedResults,
    }));
    get().moveToProteinPhase();
  },

  revealCorrectProtein: () => {
    const { currentDish } = get();
    if (!currentDish?.proteinPerServing) return;

    const actualProtein = currentDish.proteinPerServing;
    const newGuesses = [...get().proteinGuesses, actualProtein];
    const results = get().proteinGuessResults;
    const updatedResults = [
      ...results,
      {
        guess: actualProtein,
        actualProtein,
        difference: 0,
        isCorrect: true,
      },
    ];

    set(() => ({
      proteinGuesses: newGuesses,
      proteinGuessResults: updatedResults,
    }));
    get().completeGame();
  },

  getSortedCountryCoords,
});
