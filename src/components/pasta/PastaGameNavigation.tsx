"use client";

import { Button } from "@/components/ui/button";
import { usePastaStore } from "@/store/pastaStore";
import { cn } from "@/lib/utils";

export function PastaGameNavigation() {
  const {
    currentPhase,
    isPastaPhaseComplete,
    isSaucePhaseComplete,
    isRegionPhaseComplete,
    isProteinPhaseComplete,
    moveToSaucePhase,
    moveToRegionPhase,
    moveToProteinPhase,
    goBackToPastaPhase,
    goBackToSaucePhase,
    goBackToRegionPhase,
  } = usePastaStore();

  const allPhasesComplete = isProteinPhaseComplete();

  // Navigation from pasta phase
  if (
    currentPhase === "pasta" &&
    (isSaucePhaseComplete() || isRegionPhaseComplete() || isProteinPhaseComplete())
  ) {
    return (
      <div className="flex flex-col gap-4 mt-4">
        <div className="text-center">
          <Button
            onClick={moveToSaucePhase}
            className="px-4 py-2 rounded-lg"
            variant="phase"
          >
            {allPhasesComplete ? "Review the sauce guess" : "Guess the sauce"}
          </Button>
        </div>
      </div>
    );
  }

  // Navigation from sauce phase
  if (currentPhase === "sauce") {
    return (
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex justify-between gap-2 items-center">
          <Button
            onClick={goBackToPastaPhase}
            className="px-3 py-1 w-[42px] h-[42px]"
            variant="neutral"
          >
            ←
          </Button>
          {(isRegionPhaseComplete() || isProteinPhaseComplete()) && (
            <Button
              onClick={moveToRegionPhase}
              className="px-4 py-2 rounded-lg flex-1"
              variant="phase"
            >
              {allPhasesComplete ? "Review the region guess" : "Guess the region"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Navigation from region phase
  if (currentPhase === "region") {
    return (
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex justify-between gap-2 items-center">
          <Button
            onClick={goBackToSaucePhase}
            className="px-3 py-1 w-[42px] h-[42px]"
            variant="neutral"
          >
            ←
          </Button>
          {isProteinPhaseComplete() && (
            <Button
              onClick={moveToProteinPhase}
              className="px-4 py-2 rounded-lg flex-1"
              variant="phase"
            >
              {allPhasesComplete ? "Review the protein guess" : "Guess the protein"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Navigation from protein phase
  if (currentPhase === "protein") {
    return (
      <div className="flex flex-col gap-4 mt-2">
        <div className="text-left">
          <Button
            onClick={goBackToRegionPhase}
            className="px-3 py-1 w-[42px] h-[42px]"
            variant="neutral"
          >
            ←
          </Button>
        </div>
      </div>
    );
  }

  // Complete phase - show all navigation
  if (currentPhase === "complete") {
    return (
      <div className="flex flex-col gap-4 mt-4">
        <div className="text-center space-y-2">
          <Button
            onClick={goBackToPastaPhase}
            className="px-4 py-2 rounded-lg w-full"
            variant="phase"
          >
            Review pasta guess
          </Button>
          <Button
            onClick={goBackToSaucePhase}
            className="px-4 py-2 rounded-lg w-full"
            variant="phase"
          >
            Review sauce guess
          </Button>
          <Button
            onClick={goBackToRegionPhase}
            className="px-4 py-2 rounded-lg w-full"
            variant="phase"
          >
            Review region guess
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
