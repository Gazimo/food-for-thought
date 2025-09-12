"use client";

import { useGameStore } from "@/store/gameStore";
import { Calendar, HelpCircle, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface GameHeaderProps {
  onShowRules: () => void;
}

export function GameHeader({ onShowRules }: GameHeaderProps) {
  const { isPlayingArchive, archiveDate, exitArchiveMode } = useGameStore();
  const router = useRouter();

  const handleBackToToday = () => {
    exitArchiveMode();
    router.push("/play");
  };

  return (
    <header className="w-full flex justify-between items-center">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-orange-600">Food for Thought</h1>
        {isPlayingArchive && archiveDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                Archive:{" "}
                {new Date(archiveDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <button
              onClick={handleBackToToday}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              title="Back to today's game"
            >
              <Home className="h-3 w-3" />
              Today
            </button>
          </div>
        )}
      </div>
      <HelpCircle className="cursor-pointer" onClick={onShowRules} />
    </header>
  );
}
