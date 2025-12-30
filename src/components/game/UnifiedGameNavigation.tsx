"use client";

import { Button } from "@/components/ui/button";
import { GameConfig, PhaseId } from "@/config/games/types";
import { cn } from "@/lib/utils";

interface UnifiedGameNavigationProps {
  currentPhaseId: PhaseId;
  gameConfig: GameConfig;
  onMoveToPhase: (phaseId: PhaseId) => void;
  isPhaseComplete: boolean;
}

export function UnifiedGameNavigation({
  currentPhaseId,
  gameConfig,
  onMoveToPhase,
  isPhaseComplete,
}: UnifiedGameNavigationProps) {
  const currentIndex = gameConfig.phases.findIndex(
    (p) => p.id === currentPhaseId
  );
  const currentPhase = gameConfig.phases[currentIndex];
  const previousPhase = gameConfig.phases[currentIndex - 1];
  const nextPhase = gameConfig.phases[currentIndex + 1];

  const showBackButton = currentIndex > 0;
  const isLastPhase = currentIndex === gameConfig.phases.length - 1;
  const showNextButton = isPhaseComplete && nextPhase && !isLastPhase;
  const nextButtonLabel = currentPhase?.navigationLabel || "Continue";

  if (!showBackButton && !showNextButton) {
    return null;
  }

  if (currentIndex === 0 && showNextButton) {
    return (
      <div className="flex flex-col gap-4 mt-4">
        <div className="text-center">
          <Button
            onClick={() => onMoveToPhase(nextPhase.id)}
            className="px-4 py-2 rounded-lg"
            variant="phase"
          >
            {nextButtonLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (showBackButton && showNextButton) {
    return (
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex justify-between gap-2 items-center">
          <Button
            onClick={() => onMoveToPhase(previousPhase.id)}
            className="px-3 py-1 w-[42px] h-[42px]"
            variant="neutral"
          >
            ←
          </Button>
          <Button
            onClick={() => onMoveToPhase(nextPhase.id)}
            className="px-4 py-2 rounded-lg flex-1"
            variant="phase"
          >
            {nextButtonLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (showBackButton && !showNextButton) {
    return (
      <div className="flex flex-col gap-4 mt-2">
        <div className="text-left">
          <Button
            onClick={() => onMoveToPhase(previousPhase.id)}
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
