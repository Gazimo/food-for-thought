"use client";

import { useOptionalGameContext } from "@/contexts";
import { useGameStore } from "@/store";
import { Calendar, HelpCircle, Home, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GameHeaderProps {
  onShowRules: () => void;
}

export function GameHeader({ onShowRules }: GameHeaderProps) {
  const { isPlayingArchive, archiveDate, exitArchiveMode } = useGameStore();
  const gameContext = useOptionalGameContext();
  const router = useRouter();

  // Get game-specific info from context, with fallbacks for default game
  const gameName = gameContext?.gameConfig.name ?? "Food for Thought";
  const gameUrlPath = gameContext?.gameConfig.urlPath ?? "/play";

  const handleBackToToday = () => {
    exitArchiveMode();
    router.push(gameUrlPath);
  };

  // Show Statistics button always (not just after completing game)
  const showStatisticsButton = !isPlayingArchive;

  return (
    <header className="w-full flex justify-between items-center">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-orange-600">{gameName}</h1>
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
      <div className="flex items-center gap-3">
        {showStatisticsButton && (
          <Link href="/statistics">
            <button
              className="flex items-center gap-1 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md transition-colors"
              title="View Statistics"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">
                Statistics
              </span>
            </button>
          </Link>
        )}
        <HelpCircle className="cursor-pointer" onClick={onShowRules} />
      </div>
    </header>
  );
}
