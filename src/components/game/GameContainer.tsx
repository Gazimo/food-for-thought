"use client";

import { Suspense } from "react";
import { GameErrorBoundary } from "./GameErrorBoundary";
import { GameInitializer } from "./GameInitializer";
import { GameLayout } from "./GameLayout";

export function GameContainer() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameErrorBoundary>
        <GameInitializer>
          <GameLayout />
        </GameInitializer>
      </GameErrorBoundary>
    </Suspense>
  );
}
