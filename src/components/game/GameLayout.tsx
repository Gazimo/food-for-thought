"use client";

import { ArchiveStatus } from "@/components/ArchiveStatus";
import { GameFooter } from "@/components/GameFooter";
import { GameHeader } from "@/components/GameHeader";
import { PhaseContainer } from "@/components/PhaseContainer";
import { useGameStore } from "@/store";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GamePhaseRenderer } from "./GamePhaseRenderer";
import { UnifiedGameNavigation } from "./UnifiedGameNavigation";

const IntroModal = dynamic(
  () => import("@/components/IntroModal").then((mod) => mod.IntroModal),
  { ssr: false }
);

const UnifiedResultModal = dynamic(
  () => import("@/components/game/UnifiedResultModal").then((mod) => mod.UnifiedResultModal),
  { ssr: false }
);

/**
 * Game Layout
 *
 * Provides consistent layout for all games using unified architecture.
 */
export function GameLayout() {
  return <UnifiedArchitectureLayout />;
}

/**
 * Layout for unified architecture (Pasta and future games)
 */
function UnifiedArchitectureLayout() {
  const gameConfig = useGameStore((state) => state.gameConfig);
  const currentPhaseId = useGameStore((state) => state.currentPhaseId);
  const moveToPhase = useGameStore((state) => state.moveToPhase);
  const phases = useGameStore((state) => state.phases);
  const isArchiveMode = useGameStore((state) => state.isArchiveMode);
  const exitUnifiedArchiveMode = useGameStore((state) => state.exitUnifiedArchiveMode);
  const gameError = useGameStore((state) => state.gameError);
  const clearGameError = useGameStore((state) => state.clearGameError);

  const [isIntroModalOpen, setIntroModalOpen] = useState(false);
  const [isResultModalVisible, setResultModalVisible] = useState(false);

  const isCurrentPhaseComplete = () => {
    if (!currentPhaseId) return false;
    if (currentPhaseId === "complete") return true; // Game is complete, so last phase is complete
    const currentPhase = phases[currentPhaseId];
    return currentPhase?.isComplete || false;
  };

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem("hasSeenPastaIntro");
    if (!hasSeenIntro) {
      setIntroModalOpen(true);
    }
  }, []);

  const closeIntroModal = () => {
    localStorage.setItem("hasSeenPastaIntro", "true");
    setIntroModalOpen(false);
  };

  // Show result modal when game is complete (including archive games)
  useEffect(() => {
    if (currentPhaseId === "complete") {
      setResultModalVisible(true);
    }
  }, [currentPhaseId]);

  const isGameComplete = currentPhaseId === "complete";

  // Show error page if there's a game error
  if (gameError) {
    const isArchiveAccessError = gameError.status === 403;
    const is404Error = gameError.status === 404;

    return (
      <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-amber-600">
              {isArchiveAccessError
                ? "Archive Access Restricted"
                : is404Error
                ? "Game Not Found"
                : "Error Loading Game"}
            </h2>
            <p className="text-gray-600 mb-4">
              {isArchiveAccessError
                ? "Archives are locked. Share today's results to unlock!"
                : gameError.message}
            </p>
            <Button
              onClick={() => {
                clearGameError();
                if (typeof window !== "undefined") {
                  const gameRoute = gameConfig?.id === "italian-pasta" ? "/pasta" : "/play";
                  window.location.href = gameRoute;
                }
              }}
              variant="default"
            >
              {isArchiveAccessError || is404Error ? "Back to Today's Game" : "Retry"}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
      <IntroModal isOpen={isIntroModalOpen} onClose={closeIntroModal} />
      <GameHeader onShowRules={() => setIntroModalOpen(true)} />

      <PhaseContainer>
        <AnimatePresence mode="wait">
          <GamePhaseRenderer />
        </AnimatePresence>

        {/* Navigation at layout level */}
        {gameConfig && currentPhaseId && (
          <UnifiedGameNavigation
            currentPhaseId={
              currentPhaseId === "complete"
                ? gameConfig.phases[gameConfig.phases.length - 1].id
                : currentPhaseId
            }
            gameConfig={gameConfig}
            onMoveToPhase={moveToPhase}
            isPhaseComplete={isCurrentPhaseComplete()}
          />
        )}

        {/* Show Results Button */}
        {isGameComplete && !isResultModalVisible && (
          <div className="text-center mt-4">
            <Button
              onClick={() => setResultModalVisible(true)}
              className="px-4 py-2"
              variant="secondary"
            >
              Show Results
            </Button>
          </div>
        )}
      </PhaseContainer>

      <UnifiedResultModal
        visible={isResultModalVisible}
        onClose={() => setResultModalVisible(false)}
      />

      <GameFooter />
    </main>
  );
}
