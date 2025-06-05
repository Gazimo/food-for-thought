import { useGameStore } from "@/store/gameStore";
import posthog from "posthog-js";
import { GamePhase } from "../types/game";

export function usePhaseTransition() {
  const { activePhase, setActivePhase } = useGameStore();

  const transitionToPhase = (targetPhase: Exclude<GamePhase, "complete">) => {
    setActivePhase(targetPhase);
    posthog.capture("phase_transition", {
      from: activePhase,
      to: targetPhase,
    });
  };

  return { transitionToPhase, activePhase };
}
