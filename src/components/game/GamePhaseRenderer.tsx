"use client";

import { CountryPhase } from "@/app/play/CountryPhase";
import { DishPhase } from "@/app/play/DishPhase";
import { ProteinPhase } from "@/app/play/ProteinPhase";
import { PhaseRenderer } from "@/components/PhaseRenderer";
import { getPhaseConfig } from "@/config/gamePhases";
import { useTodaysDish } from "@/hooks/useDishes";
import { useGameStore } from "@/store";

export function GamePhaseRenderer() {
  const { activePhase, isPlayingArchive, archiveDate } = useGameStore();
  const effectiveArchiveDate = isPlayingArchive ? archiveDate : null;
  const { dish, isLoading } = useTodaysDish(effectiveArchiveDate || undefined);

  const phaseConfig = getPhaseConfig(activePhase);
  if (!phaseConfig) return null;

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
        {correctPhase === "dish" && <DishPhase />}
        {correctPhase === "country" && <CountryPhase />}
        {correctPhase === "protein" && <ProteinPhase />}
      </PhaseRenderer>
    );
  }

  // Normal rendering
  switch (activePhase) {
    case "dish":
      return (
        <PhaseRenderer {...commonProps}>
          <DishPhase />
        </PhaseRenderer>
      );
    case "country":
      return (
        <PhaseRenderer {...commonProps}>
          <CountryPhase />
        </PhaseRenderer>
      );
    case "protein":
      return (
        <PhaseRenderer {...commonProps}>
          <ProteinPhase />
        </PhaseRenderer>
      );
    default:
      return null;
  }
}
