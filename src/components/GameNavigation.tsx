import { Button } from "@/components/ui/button";
import { usePhaseTransition } from "@/hooks/usePhaseTransition";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";
import { useEffect } from "react";

interface GameNavigationProps {
  activePhase: string;
  gamePhase: string;
  modalVisible: boolean;
  toggleModal: (visible: boolean) => void;
}

export function GameNavigation({
  activePhase,
  gamePhase,
}: GameNavigationProps) {
  const { transitionToPhase } = usePhaseTransition();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "BUTTON" ||
        target.contentEditable === "true"
      ) {
        return;
      }
      if (
        activePhase === "dish" &&
        (gamePhase === "country" ||
          gamePhase === "protein" ||
          gamePhase === "complete")
      ) {
        event.preventDefault();
        transitionToPhase("country");
      } else if (
        activePhase === "country" &&
        (gamePhase === "protein" || gamePhase === "complete")
      ) {
        event.preventDefault();
        transitionToPhase("protein");
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [activePhase, gamePhase, transitionToPhase]);

  if (
    activePhase === "dish" &&
    (gamePhase === "country" ||
      gamePhase === "protein" ||
      gamePhase === "complete")
  ) {
    return (
      <div className="flex flex-col gap-4 mt-4">
        <div className="text-center">
          <Button
            onClick={() => transitionToPhase("country")}
            className={cn("px-4 py-2 rounded-lg", gamePhase === "country")}
            variant="phase"
          >
            {gamePhase === "complete"
              ? "Review your country guess"
              : "Guess where it's from"}
          </Button>
        </div>
      </div>
    );
  }

  // Navigation from country phase
  if (activePhase === "country") {
    return (
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex justify-between gap-2 items-center">
          <Button
            onClick={() => transitionToPhase("dish")}
            className="px-3 py-1 w-[42px] h-[42px]"
            variant="neutral"
          >
            ←
          </Button>
          {(gamePhase === "protein" || gamePhase === "complete") && (
            <Button
              onClick={() => transitionToPhase("protein")}
              className={cn(
                "px-4 py-2 rounded-lg flex-1",
                gamePhase === "protein"
              )}
              variant="phase"
            >
              {gamePhase === "complete"
                ? "Review protein guess"
                : "Guess the protein"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Navigation from protein phase
  if (activePhase === "protein") {
    return (
      <div className="flex flex-col gap-4 mt-2">
        <div className="text-left">
          <Button
            onClick={() => transitionToPhase("country")}
            className="px-3 py-1 w-[42px] h-[42px]"
            variant="neutral"
          >
            ←
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

export function ShowResultsButton({
  gamePhase,
  modalVisible,
  toggleModal,
}: {
  gamePhase: string;
  modalVisible: boolean;
  toggleModal: (visible: boolean) => void;
}) {
  if (gamePhase !== "complete" || modalVisible) return null;

  return (
    <div className="text-center mt-4">
      <Button
        onClick={() => {
          toggleModal(true);
          posthog.capture("toggle_recipe_modal", { opened: true });
        }}
        className="px-4 py-2"
        variant="secondary"
      >
        Show Results
      </Button>
    </div>
  );
}
