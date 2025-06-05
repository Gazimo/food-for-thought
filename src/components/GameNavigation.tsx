import { Button } from "@/components/ui/button";
import { usePhaseTransition } from "@/hooks/usePhaseTransition";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";

interface GameNavigationProps {
  activePhase: string;
  gamePhase: string;
  modalVisible: boolean;
  toggleModal: (visible: boolean) => void;
}

export function GameNavigation({
  activePhase,
  gamePhase,
  modalVisible,
  toggleModal,
}: GameNavigationProps) {
  const { transitionToPhase } = usePhaseTransition();

  if (
    activePhase === "dish" &&
    (gamePhase === "country" ||
      gamePhase === "protein" ||
      gamePhase === "complete")
  ) {
    return (
      <div className="text-center mt-4">
        <Button
          onClick={() => transitionToPhase("country")}
          className={cn(
            "px-4 py-2 rounded-lg",
            gamePhase === "country" && "animate-pulse"
          )}
          variant="phase"
        >
          {gamePhase === "complete"
            ? "Review your country guess"
            : "Guess where it's from"}
        </Button>
      </div>
    );
  }

  if (activePhase === "country") {
    return (
      <div className="flex justify-between mt-2 gap-2">
        <Button
          onClick={() => transitionToPhase("dish")}
          className="px-3 py-1 rounded"
          variant="neutral"
        >
          ←
        </Button>
        {(gamePhase === "protein" || gamePhase === "complete") && (
          <Button
            onClick={() => transitionToPhase("protein")}
            className={cn(
              "px-4 py-2 rounded-lg flex-1",
              gamePhase === "protein" && "animate-pulse"
            )}
            variant="phase"
          >
            {gamePhase === "complete"
              ? "Review protein guess"
              : "Guess the protein"}
          </Button>
        )}
      </div>
    );
  }

  if (activePhase === "protein") {
    return (
      <div className="text-left mt-2">
        <Button
          onClick={() => transitionToPhase("country")}
          className="px-3 py-1 rounded"
          variant="neutral"
        >
          ←
        </Button>
      </div>
    );
  }

  if (gamePhase === "complete" && !modalVisible) {
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

  return null;
}
