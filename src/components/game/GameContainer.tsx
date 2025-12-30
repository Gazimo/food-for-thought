"use client";

import { GameTypeId, getDefaultGame } from "@/config/games";
import { GameProvider } from "@/contexts";
import { Suspense } from "react";
import { GameErrorBoundary } from "./GameErrorBoundary";
import { GameInitializer } from "./GameInitializer";
import { GameLayout } from "./GameLayout";

interface GameContainerProps {
  /** Game type ID - defaults to the original Food for Thought game */
  gameTypeId?: GameTypeId;
}

export function GameContainer({
  gameTypeId = getDefaultGame().id,
}: GameContainerProps) {
  return (
    <GameProvider gameTypeId={gameTypeId}>
      <Suspense fallback={<div>Loading...</div>}>
        <GameErrorBoundary>
          <GameInitializer>
            <GameLayout />
          </GameInitializer>
        </GameErrorBoundary>
      </Suspense>
    </GameProvider>
  );
}
