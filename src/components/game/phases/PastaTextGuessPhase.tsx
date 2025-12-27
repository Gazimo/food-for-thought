"use client";

import { TileGrid } from "@/components/dish-image/TileGrid";
import { TextInput, GiveUpButton } from "@/components/inputs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { HintsFeedback } from "@/components/game/HintsFeedback";
import { PhaseConfig } from "@/config/games/types";
import { Pasta } from "@/types/pasta";
import { normalizeForComparison } from "@/utils/stringNormalization";
import { getClosestGuess } from "@/utils/gameHelpers";
import { memo, ReactNode, useState } from "react";
import { toast } from "react-hot-toast";

interface PastaTextGuessPhaseProps {
  /** Phase configuration */
  phaseConfig: PhaseConfig;
  /** Current pasta being guessed */
  pasta: Pasta;
  /** Which phase: pasta or sauce */
  phaseType: "pasta" | "sauce";
  /** Previous guesses made */
  guesses: string[];
  /** Which tiles are currently revealed */
  revealedTiles: boolean[];
  /** Number of hints revealed */
  hintsRevealed: number;
  /** Callback when a guess is made */
  onGuess: (guess: string) => void;
  /** Whether this phase is complete */
  isComplete: boolean;
  /** Callback when give up is clicked */
  onGiveUp?: () => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

/**
 * Pasta/Sauce text guessing phase component
 *
 * Handles both pasta and sauce phases with their unique features:
 * - Pasta phase: Shows plain pasta image, reveals pasta metadata hints
 * - Sauce phase: Shows pasta with sauce image, reveals sauce ingredient hints
 *
 * Based on GenericTextGuessPhase pattern but customized for pasta game's
 * two-image tile system and phase-specific hints/completion content.
 */
export const PastaTextGuessPhase = memo(function PastaTextGuessPhase({
  phaseConfig,
  pasta,
  phaseType,
  guesses,
  revealedTiles,
  hintsRevealed,
  onGuess,
  isComplete,
  onGiveUp,
  isSubmitting = false,
}: PastaTextGuessPhaseProps) {
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);

  const pastaId = pasta.id?.toString();

  // Generate tile URLs based on phase type
  const blurredTiles = Array.from(
    { length: phaseConfig.tileCount || 6 },
    (_, i) =>
      `/api/pasta/tiles?pastaId=${pastaId}&tileIndex=${i}&phase=${phaseType}&blur=true`
  );
  const fullTiles = Array.from(
    { length: phaseConfig.tileCount || 6 },
    (_, i) => `/api/pasta/tiles?pastaId=${pastaId}&tileIndex=${i}&phase=${phaseType}`
  );

  // Get phase-specific data
  const hints =
    phaseType === "pasta" ? pasta.pastaAbout || [] : pasta.sauceIngredients || [];
  const hintsLabel =
    phaseType === "pasta" ? "About This Pasta" : "Sauce Ingredients";
  const acceptableGuesses =
    phaseType === "pasta"
      ? pasta.acceptableGuesses || []
      : pasta.sauceAcceptableGuesses || [];
  const placeholder =
    phaseType === "pasta"
      ? "e.g. Spaghetti, Penne, Fusilli..."
      : "e.g. Carbonara, Bolognese, Pesto...";
  const entityType = phaseType === "pasta" ? "pasta type" : "sauce type";

  const triggerShake = () => {
    setShake(false);
    requestAnimationFrame(() => {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    });
  };

  const handleGuess = (guess: string) => {
    const trimmed = guess.trim().toLowerCase();
    const normalized = normalizeForComparison(guess);
    if (!trimmed) return;

    if (guesses.includes(trimmed)) {
      triggerShake();
      toast.error("You already guessed that!");
      return;
    }

    const isCorrect = acceptableGuesses.some(
      (acceptable) => normalizeForComparison(acceptable) === normalized
    );

    if (!isCorrect) {
      const suggestion = getClosestGuess(trimmed, acceptableGuesses);

      if (suggestion) {
        toast((t) => (
          <span>
            Did you mean{" "}
            <button
              className="text-blue-600 underline"
              onClick={() => {
                toast.dismiss(t.id);
                handleGuess(suggestion);
              }}
            >
              {suggestion}
            </button>
            ?
          </span>
        ));
        return;
      }
    }

    onGuess(trimmed);
    setInput("");

    if (isCorrect) {
      toast.success(
        phaseType === "pasta"
          ? `Correct! It's ${pasta.name}!`
          : `Correct! It's ${pasta.sauceName}!`
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tile Grid */}
      <TileGrid
        revealedTiles={revealedTiles}
        blurredTiles={blurredTiles}
        fullTiles={fullTiles}
      />

      {/* Input Section */}
      {!isComplete && (
        <div className="flex flex-col gap-2">
          {guesses.length === 0 && (
            <div className="text-center text-sm text-gray-600 mb-2">
              {phaseType === "pasta"
                ? "Identify the pasta type from its shape"
                : "Identify the classic sauce that pairs with this pasta"}
            </div>
          )}
          <div className="w-full flex gap-2 items-center">
            {onGiveUp && <GiveUpButton onGiveUp={onGiveUp} />}
            <TextInput
              value={input}
              onChange={setInput}
              onSubmit={handleGuess}
              placeholder={placeholder}
              shake={shake}
              disabled={isSubmitting}
              entityType={entityType}
            />
            <Button
              variant="primary"
              onClick={() => handleGuess(input)}
              disabled={!input.trim() || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Processing...</span>
                </div>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Hints Section - Using shared HintsFeedback component */}
      {phaseConfig.revealsHints && hints.length > 0 && (
        <HintsFeedback
          hints={hints}
          hintsRevealed={hintsRevealed}
          label={hintsLabel}
          isPhaseComplete={isComplete}
        />
      )}

      {/* Completion Content */}
      {isComplete && (
        <>
          {phaseType === "pasta" ? (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{pasta.name}</h3>
              {pasta.originStory && (
                <p className="text-gray-700">{pasta.originStory}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                {pasta.name} {pasta.sauceName}
              </h3>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  {pasta.sauceInstructions?.map((instruction, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </>
      )}

      {/* Guess History */}
      {guesses.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-600">
            Guesses: {guesses.length} of {phaseConfig.maxGuesses}
          </div>
          <div className="flex flex-wrap gap-1">
            {guesses.map((guess, index) => {
              const isCorrectGuess = acceptableGuesses?.some(
                (acceptable) =>
                  normalizeForComparison(acceptable) ===
                  normalizeForComparison(guess)
              );

              return (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs rounded border ${
                    isCorrectGuess
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-red-100 text-red-700 border-red-300"
                  }`}
                >
                  {guess}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
