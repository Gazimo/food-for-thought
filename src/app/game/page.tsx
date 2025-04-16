"use client";

import { GamePage } from "@/game/page";
import { useGameStore } from "@/store/gameStore";
import { useEffect } from "react";

export default function Game() {
  const startNewGame = useGameStore((state) => state.startNewGame);

  // Initialize game on component mount
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  return <GamePage />;
}
