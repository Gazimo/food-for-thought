"use client";

import { Suspense } from "react";
import { GameErrorBoundary } from "./GameErrorBoundary";
import { GameInitializer } from "./GameInitializer";
import { GameLayout } from "./GameLayout";

export function GameContainer() {
  return (
    <GameErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <GameInitializer>
          <GameLayout />
        </GameInitializer>
      </Suspense>
    </GameErrorBoundary>
  );
}
