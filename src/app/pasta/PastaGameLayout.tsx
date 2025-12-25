"use client";

import { GameFooter } from "@/components/GameFooter";
import { GameHeader } from "@/components/GameHeader";
import { PastaGameNavigation } from "@/components/pasta/PastaGameNavigation";
import { PastaIntroModal } from "@/components/pasta/PastaIntroModal";
import { usePastaStore } from "@/store/pastaStore";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DynamicPastaIntroModal = dynamic(
  () =>
    import("@/components/pasta/PastaIntroModal").then(
      (mod) => mod.PastaIntroModal
    ),
  { ssr: false }
);

interface PastaGameLayoutProps {
  children: React.ReactNode;
}

export function PastaGameLayout({ children }: PastaGameLayoutProps) {
  const { currentPhase } = usePastaStore();
  const [isIntroModalOpen, setIntroModalOpen] = useState(false);

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

  // Scroll to top when phase changes, with smooth behavior
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPhase]);

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicPastaIntroModal
        isOpen={isIntroModalOpen}
        onClose={closeIntroModal}
      />
      <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col flex-1">
        <GameHeader onShowRules={() => setIntroModalOpen(true)} />

        <div className="flex-1">
          {children}
          <PastaGameNavigation />
        </div>

        <GameFooter />
      </main>
    </div>
  );
}
