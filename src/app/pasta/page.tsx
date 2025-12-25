"use client";

import { italianPastaConfig } from "@/config/games";
import { GameProvider } from "@/contexts/GameContext";
import { redirect } from "next/navigation";
import { PastaGameLayout } from "./PastaGameLayout";
import { PastaGameOrchestrator } from "./PastaGameOrchestrator";

export default function PastaGamePage() {
  // Redirect to main game if pasta game is not enabled yet
  if (!italianPastaConfig.enabled) {
    redirect("/play");
  }

  return (
    <GameProvider gameTypeId="italian-pasta">
      <PastaGameLayout>
        <PastaGameOrchestrator />
      </PastaGameLayout>
    </GameProvider>
  );
}
