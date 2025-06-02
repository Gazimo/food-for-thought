"use client";
import { Button } from "@/components/ui/button";
import { getClosestGuess } from "@/utils/gameHelpers";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useGameStore } from "../store/gameStore";
import { GiveUpButton, NumberInput, TextInput } from "./inputs";

interface GuessInputProps {
  placeholder: string;
  onGuess: (guess: string) => void;
  suggestions?: string[];
  previousGuesses?: string[];
  isComplete?: boolean;
  acceptableGuesses?: string[];
  onProteinGuess?: (guess: number) => boolean;
  previousProteinGuesses?: number[];
  actualProtein?: number;
}

export const GuessInput: React.FC<GuessInputProps> = ({
  placeholder,
  onGuess,
  suggestions = [],
  previousGuesses = [],
  isComplete = false,
  acceptableGuesses = [],
  onProteinGuess,
  previousProteinGuesses = [],
  actualProtein,
}) => {
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);
  const {
    revealAllTiles,
    completeGame,
    moveToCountryPhase,
    moveToProteinPhase,
    activePhase,
    currentDish,
    revealCorrectCountry,
    revealCorrectProtein,
  } = useGameStore();

  const isProteinPhase = activePhase === "protein";

  const triggerShake = () => {
    setShake(false);
    requestAnimationFrame(() => {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    });
  };

  const handleProteinGuess = (guess: number) => {
    const isCorrect = onProteinGuess?.(guess);

    if (isCorrect) {
      toast.success(`Correct! ${actualProtein}g protein per serving!`);
    } else {
      const difference = Math.abs(guess - (actualProtein || 0));
      if (difference <= 2) {
        toast("🔥 Very close!");
      } else if (difference <= 5) {
        toast("🌡️ Getting warm!");
      } else if (difference <= 10) {
        toast("❄️ Getting cold!");
      } else {
        toast("🧊 Freezing!");
      }
    }

    setInput("");
  };

  const handleTextGuess = (guess: string) => {
    const trimmed = guess.trim().toLowerCase();
    if (!trimmed) return;

    if (previousGuesses.includes(trimmed)) {
      triggerShake();
      toast.error("You already guessed that!");
      return;
    }

    const isCorrect = acceptableGuesses
      .map((s) => s.toLowerCase())
      .includes(trimmed);

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
                handleTextGuess(suggestion);
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
  };

  const handleGiveUp = () => {
    revealAllTiles();

    if (activePhase === "dish") {
      moveToCountryPhase();
    } else if (activePhase === "country" && currentDish) {
      revealCorrectCountry();
    } else if (activePhase === "protein" && currentDish?.proteinPerServing) {
      revealCorrectProtein();
    } else {
      completeGame();
    }
  };

  const canSubmit = isProteinPhase
    ? !isNaN(parseInt(input)) && parseInt(input) >= 0
    : !!input.trim();

  const shouldShowGiveUp = isProteinPhase
    ? previousProteinGuesses.length >= 3
    : false;

  return (
    <div className="w-full flex gap-2 items-center">
      <GiveUpButton onGiveUp={handleGiveUp} />

      {isProteinPhase ? (
        <NumberInput
          value={input}
          onChange={setInput}
          onSubmit={handleProteinGuess}
          placeholder={placeholder}
          previousGuesses={previousProteinGuesses}
          isComplete={isComplete}
          shake={shake}
          min={0}
          max={200}
        />
      ) : (
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleTextGuess}
          placeholder={placeholder}
          suggestions={suggestions}
          previousGuesses={previousGuesses}
          isComplete={isComplete}
          shake={shake}
        />
      )}

      <Button
        variant="primary"
        onClick={() => {
          if (isProteinPhase) {
            handleProteinGuess(parseInt(input));
          } else {
            handleTextGuess(input);
          }
        }}
        disabled={!canSubmit || isComplete}
      >
        Submit
      </Button>

      {shouldShowGiveUp && !isComplete && (
        <div className="absolute top-full left-0 right-0 text-center mt-2">
          <Button
            onClick={handleGiveUp}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Give up and see results
          </Button>
        </div>
      )}
    </div>
  );
};
