"use client";

import { useTodaysPasta } from "@/hooks/pasta";
import { usePastaStore } from "@/store/pastaStore";
import { useEffect } from "react";
import { ItalianRegionPhase } from "./ItalianRegionPhase";
import { PastaPhase } from "./PastaPhase";
import { PastaProteinPhase } from "./PastaProteinPhase";
import { SaucePhase } from "./SaucePhase";

/**
 * Main orchestrator for the Pasta Perfetto game
 * Manages phase transitions and state synchronization
 */
export function PastaGameOrchestrator() {
  const { data: pasta, isLoading, isError } = useTodaysPasta();

  const {
    currentPasta,
    currentPhase,
    setCurrentPasta,
    loadGameState,
    startNewGame,
    // Phase 1 - Pasta
    pastaGuesses,
    pastaRevealedTiles,
    pastaRevealedAbout,
    guessPasta,
    isPastaPhaseComplete,
    moveToSaucePhase,
    giveUpPastaPhase,
    // Phase 2 - Sauce
    sauceGuesses,
    sauceRevealedTiles,
    sauceRevealedIngredients,
    guessSauce,
    isSaucePhaseComplete,
    moveToRegionPhase,
    giveUpSaucePhase,
    // Phase 3 - Region
    regionGuesses,
    regionGuessResults,
    guessRegion,
    isRegionPhaseComplete,
    moveToProteinPhase,
    // Phase 4 - Protein
    proteinGuesses,
    proteinGuessResults,
    guessProtein,
    isProteinPhaseComplete,
    completeGame,
  } = usePastaStore();

  // Give up handlers
  const handlePastaGiveUp = () => {
    giveUpPastaPhase();
  };

  const handleSauceGiveUp = () => {
    giveUpSaucePhase();
  };

  // Initialize game when pasta data is loaded
  useEffect(() => {
    if (pasta && !currentPasta) {
      setCurrentPasta(pasta);

      // Try to load saved game state
      const date = pasta.releaseDate || new Date().toISOString().split("T")[0];
      loadGameState(date);

      // If no saved state exists, start new game
      if (!currentPasta) {
        startNewGame();
      }
    }
  }, [pasta, currentPasta, setCurrentPasta, loadGameState, startNewGame]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !pasta) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">
            Failed to load today's pasta
          </h2>
          <p className="text-sm text-red-600 mt-1">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  // Render current phase
  return (
    <>
      {currentPhase === "pasta" && (
          <PastaPhase
            pasta={pasta}
            guesses={pastaGuesses}
            revealedTiles={pastaRevealedTiles}
            revealedAbout={pastaRevealedAbout}
            onGuess={guessPasta}
            isComplete={isPastaPhaseComplete()}
            onContinue={moveToSaucePhase}
            onGiveUp={handlePastaGiveUp}
          />
        )}

        {currentPhase === "sauce" && (
          <SaucePhase
            pasta={pasta}
            guesses={sauceGuesses}
            revealedTiles={sauceRevealedTiles}
            revealedIngredients={sauceRevealedIngredients}
            onGuess={guessSauce}
            isComplete={isSaucePhaseComplete()}
            onContinue={moveToRegionPhase}
            onGiveUp={handleSauceGiveUp}
          />
        )}

        {currentPhase === "region" && (
          <ItalianRegionPhase
            pasta={pasta}
            guesses={regionGuesses}
            guessResults={regionGuessResults}
            onGuess={guessRegion}
            isComplete={isRegionPhaseComplete()}
            onContinue={moveToProteinPhase}
          />
        )}

        {currentPhase === "protein" && (
          <PastaProteinPhase
            pasta={pasta}
            guesses={proteinGuesses}
            guessResults={proteinGuessResults}
            onGuess={guessProtein}
            isComplete={isProteinPhaseComplete()}
            onContinue={completeGame}
          />
        )}

      {currentPhase === "complete" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-green-600">
            🎉 Game Complete!
          </h2>
          <p className="text-gray-700">
            Check back tomorrow for a new pasta challenge
          </p>
          {/* TODO: Show PastaResultModal here */}
        </div>
      )}
    </>
  );
}
