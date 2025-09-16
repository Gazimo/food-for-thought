"use client";

import { ArchiveStatus } from "@/components/ArchiveStatus";
import { GameFooter } from "@/components/GameFooter";
import { GameHeader } from "@/components/GameHeader";
import { GameNavigation, ShowResultsButton } from "@/components/GameNavigation";
import { PhaseContainer } from "@/components/PhaseContainer";
import { useGameStore } from "@/store";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GamePhaseRenderer } from "./GamePhaseRenderer";

const IntroModal = dynamic(
  () => import("@/components/IntroModal").then((mod) => mod.IntroModal),
  { ssr: false }
);

const ResultModal = dynamic(
  () => import("@/components/ResultModal").then((mod) => mod.ResultModal),
  { ssr: false }
);

export function GameLayout() {
  const {
    gamePhase,
    activePhase,
    modalVisible,
    toggleModal,
    isPlayingArchive,
    isArchivesUnlockedNow,
  } = useGameStore();

  const [isIntroModalOpen, setIntroModalOpen] = useState(false);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem("hasSeenIntro");
    if (!hasSeenIntro) {
      setIntroModalOpen(true);
    }
  }, []);

  const closeIntroModal = () => {
    localStorage.setItem("hasSeenIntro", "true");
    setIntroModalOpen(false);
  };

  return (
    <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
      <IntroModal isOpen={isIntroModalOpen} onClose={closeIntroModal} />
      <GameHeader onShowRules={() => setIntroModalOpen(true)} />

      <PhaseContainer>
        <AnimatePresence mode="wait">
          <GamePhaseRenderer />
        </AnimatePresence>

        <GameNavigation
          activePhase={activePhase}
          gamePhase={gamePhase}
          modalVisible={modalVisible}
          toggleModal={toggleModal}
        />

        <ShowResultsButton
          gamePhase={gamePhase}
          modalVisible={modalVisible}
          toggleModal={toggleModal}
        />

        {gamePhase === "complete" && !modalVisible && !isPlayingArchive && (
          <div className="mt-4">
            <ArchiveStatus isUnlocked={isArchivesUnlockedNow()} />
          </div>
        )}
      </PhaseContainer>

      <ResultModal />
      <GameFooter />
    </main>
  );
}
