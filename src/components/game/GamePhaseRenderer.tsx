"use client";

// Unified Architecture Components (props-based components)
import { PastaTextGuessPhase } from "@/components/game/phases/PastaTextGuessPhase";
import { ItalianRegionPhase } from "@/components/game/phases/ItalianRegionPhase";
import { NumericGuessPhase } from "@/components/game/phases/NumericGuessPhase";
import { ProteinPhase } from "@/components/game/phases/ProteinPhase";
import { DishPhase } from "@/components/game/phases/DishPhase";
import { MapGuessPhase } from "@/components/game/phases/MapGuessPhase";
import { PhaseRenderer } from "@/components/PhaseRenderer";
import { useGameStore } from "@/store";
import { useGameContext } from "@/contexts/GameContext";
import { PhaseConfig } from "@/config/games/types";
import {
  validatePastaGuess,
  validateSauceGuess,
  validateRegionGuess,
  validateProteinGuess as validatePastaProteinGuess,
} from "@/engine/validators/pastaValidators";
import {
  validateDishGuess,
  validateCountryGuess,
  validateProteinGuess as validateFFTProteinGuess,
} from "@/engine/validators/fftValidators";
import debugLogger from "@/utils/debugLogger";

/**
 * Unified Game Phase Renderer
 *
 * Uses unifiedGameSlice with props-based components for all games.
 */
export function GamePhaseRenderer() {
  return <UnifiedArchitectureRenderer />;
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

  // F4T game phases
  if (gameTypeId === "food-for-thought") {
    switch (phaseId) {
      case "dish":
        return (
          <DishPhase
            {...commonPhaseProps}
            dish={item}
            onGuess={(guess: string) => makeGuess(guess, validateDishGuess)}
          />
        );

      case "country": {
        const { MapGuessVisualizer } = require("@/components/MapGuessVisualizer");
        const { getCountryNames, getCountryCoordsMap } = require("@/utils/countries");
        const { getColorForDistance, getDirectionArrow } = require("@/utils/colors");

        const countryNames = getCountryNames();
        const countryCoords = getCountryCoordsMap();

        // Build enriched guesses for map visualization
        const enrichedGuesses = (phaseState.guessResults || []).map((result: any, index: number) => ({
          country: phaseState.guesses[index],
          isCorrect: result.isCorrect,
          lat: countryCoords[result.country?.toLowerCase()]?.lat || 0,
          lng: countryCoords[result.country?.toLowerCase()]?.lng || 0,
          distance: result.distance || 0,
        }));

        // Convert to LocationGuessResult format for feedback component
        const locationResults = (phaseState.guessResults || []).map((r: any) => ({
          location: r.country,
          distance: r.distance,
          direction: r.direction,
          isCorrect: r.isCorrect,
        }));

        // Color class mapper (matching legacy implementation)
        const getColorClass = (distance: number): string => {
          const hex = getColorForDistance(distance);
          const colorMap: Record<string, string> = {
            "#22c55e": "bg-green-500",
            "#4ade80": "bg-green-400",
            "#86efac": "bg-green-300",
            "#facc15": "bg-yellow-400",
            "#fb923c": "bg-orange-400",
            "#fca5a5": "bg-red-300",
            "#ef4444": "bg-red-500",
          };
          return colorMap[hex] || "bg-gray-400";
        };

        return (
          <MapGuessPhase
            mapVisualizer={<MapGuessVisualizer guesses={enrichedGuesses} />}
            suggestions={countryNames}
            previousGuesses={phaseState.guesses as string[]}
            onGuess={(guess: string) => makeGuess(guess, validateCountryGuess)}
            onGiveUp={giveUpPhase}
            placeholder="Enter a country name..."
            locationType="country"
            guessResults={locationResults}
            getColorForDistance={getColorClass}
            getDirectionArrow={getDirectionArrow}
            funFact={item.funFact}
            isComplete={phaseState.isComplete}
            isSubmitting={false}
          />
        );
      }

      case "protein":
        return (
          <ProteinPhase
            imageUrl={item.imageUrl || ''}
            imageName={item.name}
            proteinSources={item.ingredients || []}
            actualProtein={item.proteinPerServing || 0}
            guesses={phaseState.guesses as number[]}
            guessResults={phaseState.guessResults || []}
            isComplete={phaseState.isComplete}
            isSubmitting={false}
            onGuess={(guess: number) => makeGuess(guess, validateFFTProteinGuess)}
            onGiveUp={giveUpPhase}
            phaseConfig={phaseConfig}
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
