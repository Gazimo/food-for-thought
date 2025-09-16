import { GameSliceCreator, UiSlice } from "../types/slices";

export const createUiSlice: GameSliceCreator<UiSlice> = (set, get) => ({
  modalVisible: true,
  activePhase: "dish",
  loading: {
    dishGuess: false,
    countryGuess: false,
    proteinGuess: false,
  },
  revealedTiles: [false, false, false, false, false, false],
  revealedIngredients: 1,
  hasRestoredState: false,

  toggleModal: (visible) => {
    if (visible !== undefined) {
      set({ modalVisible: visible });
    } else {
      set((state) => ({ modalVisible: !state.modalVisible }));
    }
  },

  setActivePhase: (phase) => {
    set({ activePhase: phase });
    get().saveCurrentGameState();
  },

  setLoading: (key, value) => {
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    }));
  },

  revealRandomTile: () => {
    const { revealedTiles } = get();
    const unrevealed = revealedTiles
      .map((val, idx) => (!val ? idx : null))
      .filter((v) => v !== null) as number[];

    if (unrevealed.length === 0) return;

    const index = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    const newTiles = [...revealedTiles];
    newTiles[index] = true;

    set({ revealedTiles: newTiles });

    setTimeout(() => {
      get().saveCurrentGameState();
    }, 0);
  },

  revealAllTiles: () => {
    set({ revealedTiles: [true, true, true, true, true, true] });
    get().saveCurrentGameState();
  },

  revealNextIngredient: () => {
    const { revealedIngredients, currentDish } = get();

    if (revealedIngredients < (currentDish?.ingredients.length || 0)) {
      set((state) => ({ revealedIngredients: state.revealedIngredients + 1 }));
      get().saveCurrentGameState();
    } else if (currentDish) {
      get().moveToCountryPhase();
    }
  },
});
