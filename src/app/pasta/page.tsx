"use client";

import { italianPastaConfig } from "@/config/games";
import { GameContainer } from "@/components/game/GameContainer";
import { redirect } from "next/navigation";

/**
 * Pasta Perfetto Game Page
 *
 * Now using the unified game architecture via GameContainer.
 * All game logic is handled by the unified system (unifiedGameSlice, GamePhaseRenderer, etc.)
 */
export default function PastaGamePage() {
  // Redirect to main game if pasta game is not enabled yet
  if (!italianPastaConfig.enabled) {
    redirect("/play");
  }

  return <GameContainer gameTypeId="italian-pasta" />;
}
