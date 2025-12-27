"use client";

// V2 Components - Refactored with specialized inputs (F4T legacy)
import { DishPhaseV2 } from "@/app/play/DishPhaseV2";
import { CountryPhaseV2 } from "@/app/play/CountryPhaseV2";
import { ProteinPhaseV2 } from "@/app/play/ProteinPhaseV2";
// Unified Architecture Components (new props-based components)
import { PastaTextGuessPhase } from "@/components/game/phases/PastaTextGuessPhase";
import { ItalianRegionPhase } from "@/components/game/phases/ItalianRegionPhase";
import { NumericGuessPhase } from "@/components/game/phases/NumericGuessPhase";
import { ProteinPhase } from "@/components/game/phases/ProteinPhase";
import { PhaseRenderer } from "@/components/PhaseRenderer";
import { getPhaseConfig } from "@/config/gamePhases";
import { useTodaysDish } from "@/hooks/useDishes";
import { useGameStore } from "@/store";
import { useGameContext, useOptionalGameContext } from "@/contexts/GameContext";
import { PhaseConfig } from "@/config/games/types";
import {
  validatePastaGuess,
  validateSauceGuess,
  validateRegionGuess,
  validateProteinGuess as validatePastaProteinGuess,
} from "@/engine/validators/pastaValidators";
import debugLogger from "@/utils/debugLogger";

// Feature flag to toggle between original and V2 components (F4T only)
const USE_V2_COMPONENTS = true;

/**
 * Unified Game Phase Renderer
 *
 * Supports two architectures:
 * 1. Legacy F4T: Uses old store slices with V2 components
 * 2. Unified: Uses unifiedGameSlice with props-based components
 *
 * The renderer detects which architecture to use by checking the GameContext.
 */
export function GamePhaseRenderer() {
  const gameContext = useOptionalGameContext();

  // Check if we're using unified architecture from game config
  const isUsingUnifiedArchitecture =
    gameContext?.gameConfig?.architecture === "unified";

  if (isUsingUnifiedArchitecture) {
    return <UnifiedArchitectureRenderer />;
  } else {
    return <LegacyFFTRenderer />;
  }
}

/**
 * Renderer for unified architecture (Pasta and future games)
 * Uses props-based components with unified store
 */
function UnifiedArchitectureRenderer() {
  const gameContext = useGameContext();
  const currentGameTypeId = useGameStore((state) => state.currentGameTypeId);
  const gameConfig = useGameStore((state) => state.gameConfig);
  const currentItem = useGameStore((state) => state.currentItem);
  const currentPhaseId = useGameStore((state) => state.currentPhaseId);
  const phases = useGameStore((state) => state.phases);
  const makeGuess = useGameStore((state) => state.makeGuess);
  const moveToNextPhase = useGameStore((state) => state.moveToNextPhase);
  const giveUpPhase = useGameStore((state) => state.giveUpPhase);

  if (!gameConfig || !currentItem) {
    return null;
  }

  // When game is complete, show the last phase (matches F4T behavior)
  const displayPhaseId = currentPhaseId === "complete"
    ? gameConfig.phases[gameConfig.phases.length - 1].id
    : currentPhaseId;

  const phaseConfig = gameConfig.phases.find((p) => p.id === displayPhaseId);
  if (!phaseConfig) {
    return null;
  }

  const phaseState = phases[displayPhaseId];
  if (!phaseState) {
    return null;
  }

  debugLogger.phase('Rendering unified phase', {
    gameTypeId: currentGameTypeId,
    phaseId: displayPhaseId,
    phaseTitle: phaseConfig.title,
    isComplete: phaseState.isComplete,
    guessCount: phaseState.guesses.length,
  });

  const commonProps = {
    phaseKey: displayPhaseId,
    title: phaseConfig.title,
  };

  // Render phase based on game and phase combination
  return (
    <PhaseRenderer {...commonProps}>
      {renderUnifiedPhase(
        currentGameTypeId!,
        displayPhaseId,
        phaseConfig,
        currentItem,
        phaseState,
        makeGuess,
        moveToNextPhase,
        giveUpPhase
      )}
    </PhaseRenderer>
  );
}

/**
 * Renders the appropriate phase component for unified architecture
 */
function renderUnifiedPhase(
  gameTypeId: string,
  phaseId: string,
  phaseConfig: PhaseConfig,
  item: any,
  phaseState: any,
  makeGuess: any,
  moveToNextPhase: any,
  giveUpPhase: any
) {
  const commonPhaseProps = {
    phaseConfig,
    guesses: phaseState.guesses,
    revealedTiles: phaseState.revealedTiles,
    hintsRevealed: phaseState.hintsRevealed,
    isComplete: phaseState.isComplete,
    onGiveUp: giveUpPhase,
  };

  // Pasta game phases
  if (gameTypeId === "italian-pasta") {
    switch (phaseId) {
      case "pasta":
        return (
          <PastaTextGuessPhase
            {...commonPhaseProps}
            phaseType="pasta"
            pasta={item}
            onGuess={(guess: string) => makeGuess(guess, validatePastaGuess)}
          />
        );

      case "sauce":
        return (
          <PastaTextGuessPhase
            {...commonPhaseProps}
            phaseType="sauce"
            pasta={item}
            onGuess={(guess: string) => makeGuess(guess, validateSauceGuess)}
          />
        );

      case "region":
        return (
          <ItalianRegionPhase
            {...commonPhaseProps}
            pasta={item}
            guessResults={phaseState.guessResults || []}
            onGuess={(guess: string) => makeGuess(guess, validateRegionGuess)}
          />
        );

      case "protein":
        return (
          <ProteinPhase
            imageUrl={item.sauceImageUrl || ''}
            imageName={item.sauceName}
            proteinSources={item.sauceIngredients || []}
            actualProtein={item.proteinPerServing || 0}
            guesses={phaseState.guesses as number[]}
            guessResults={phaseState.guessResults || []}
            isComplete={phaseState.isComplete}
            isSubmitting={false}
            onGuess={(guess: number) => makeGuess(guess, validatePastaProteinGuess)}
            onGiveUp={giveUpPhase}
            phaseConfig={phaseConfig}
            customHints={
              item.pastaFlourType ? (
                <div className="bg-yellow-50 p-3 rounded-md mb-4">
                  <p className="text-sm">
                    <strong>Hint:</strong> This pasta is made with{" "}
                    {item.pastaFlourType}
                    {item.pastaEggContent && ` and contains ${item.pastaEggContent}`}.
                  </p>
                </div>
              ) : null
            }
          />
        );
    }
  }

  // Fallback for unknown game/phase combination
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        Phase renderer not configured for {gameTypeId}/{phaseId}
      </p>
    </div>
  );
}

/**
 * Legacy renderer for F4T game
 * Uses old store slices with V2 components
 */
function LegacyFFTRenderer() {
  const { activePhase, isPlayingArchive, archiveDate } = useGameStore();
  const effectiveArchiveDate = isPlayingArchive ? archiveDate : null;
  const { dish, isLoading } = useTodaysDish(effectiveArchiveDate || undefined);

  const phaseConfig = getPhaseConfig(activePhase);
  if (!phaseConfig) return null;

  debugLogger.phase('Rendering F4T legacy phase', {
    activePhase,
    isLoading,
    hasDish: !!dish,
    isArchive: isPlayingArchive,
  });

  const commonProps = {
    phaseKey: activePhase,
    title: phaseConfig.title,
  };

  // Handle loading state with localStorage fallback
  if (isLoading || !dish) {
    let correctPhase = activePhase;

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fft-game-state");
        if (saved) {
          const parsedState = JSON.parse(saved);
          const today = new Date().toISOString().split("T")[0];
          const savedDate = parsedState.savedDate;

          if (savedDate && savedDate === today) {
            correctPhase = parsedState.activePhase || "dish";
          } else {
            correctPhase = "dish";
          }
        }
      } catch (error) {
        console.warn("Failed to read phase from localStorage:", error);
      }
    }

    const correctPhaseConfig = getPhaseConfig(correctPhase);
    const correctCommonProps = {
      phaseKey: correctPhase,
      title: correctPhaseConfig?.title || phaseConfig.title,
    };

    return (
      <PhaseRenderer {...correctCommonProps}>
        {correctPhase === "dish" && <DishPhaseV2 />}
        {correctPhase === "country" && <CountryPhaseV2 />}
        {correctPhase === "protein" && <ProteinPhaseV2 />}
      </PhaseRenderer>
    );
  }

  // Normal rendering
  switch (activePhase) {
    case "dish":
      return (
        <PhaseRenderer {...commonProps}>
          <DishPhaseV2 />
        </PhaseRenderer>
      );
    case "country":
      return (
        <PhaseRenderer {...commonProps}>
          <CountryPhaseV2 />
        </PhaseRenderer>
      );
    case "protein":
      return (
        <PhaseRenderer {...commonProps}>
          <ProteinPhaseV2 />
        </PhaseRenderer>
      );
    default:
      return null;
  }
}
