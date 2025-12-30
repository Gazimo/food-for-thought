"use client";

/**
 * Unified Result Modal
 *
 * A single result modal component that works for all games using the unified architecture.
 * Routes to different database tables and displays game-specific content based on gameConfig.
 *
 * Key Features:
 * - Routes to different DB tables via gameConfig.apiPrefix
 * - Calculates scores using game-specific calculators
 * - Adaptive display based on number of phases and game type
 * - Supports both recipe (F4T) and story (Pasta) post-game content
 * - Includes share functionality with emoji tiles
 * - Archive system with share-to-unlock
 */

import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store";
import { useGameContext } from "@/contexts/GameContext";
import Image from "next/image";
import posthog from "posthog-js";
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { PhaseId } from "@/config/games/types";
import { getScoreCalculator, PastaPhaseScores, FFTPhaseScores } from "@/utils/scoreCalculators";
import { submitPastaScore } from "@/utils/submitPastaScore";
import { useCountUp } from "@/hooks/useCountUp";
import { getDisplayTitle, getPerformanceTier } from "@/types/leaderboard";
import { generatePastaShareText } from "@/utils/pastaShareText";
import { getPastaStreak, updatePastaStreak, alreadyPlayedPastaToday } from "@/utils/pastaStreak";
import { generateShareText } from "@/utils/shareText";
import { getStreak, updateStreak } from "@/utils/streak";
import { SharePopover } from "@/components/SharePopover";
import { ArchiveStatus } from "@/components/ArchiveStatus";
import { getArchiveConfig } from "@/utils/archiveConfig";

interface UnifiedResultModalProps {
  visible: boolean;
  onClose: () => void;
}

export const UnifiedResultModal: React.FC<UnifiedResultModalProps> = ({
  visible,
  onClose,
}) => {
  const { gameConfig } = useGameContext();
  const currentGameTypeId = useGameStore((state) => state.currentGameTypeId);
  const currentItem = useGameStore((state) => state.currentItem);
  const currentPhaseId = useGameStore((state) => state.currentPhaseId);
  const gameResults = useGameStore((state) => state.gameResults);
  const phases = useGameStore((state) => state.phases);
  const markGameTracked = useGameStore((state) => state.markGameTracked);
  const isArchiveMode = useGameStore((state) => state.isArchiveMode);

  // Derive archive config from game config
  const archiveConfig = getArchiveConfig(gameConfig);

  const [showPostGameContent, setShowPostGameContent] = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [leaderboardStats, setLeaderboardStats] = useState<any>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [archivesUnlocked, setArchivesUnlocked] = useState(false);

  // Load streak and archive status on mount
  useEffect(() => {
    if (currentGameTypeId === "italian-pasta") {
      setStreak(getPastaStreak());
    } else if (currentGameTypeId === "food-for-thought") {
      setStreak(getStreak());
    }

    // Check archive unlock status using unified slice method
    if (currentGameTypeId) {
      const isUnlocked = useGameStore.getState().isUnifiedArchivesUnlockedNow();
      setArchivesUnlocked(isUnlocked);
    }
  }, [currentGameTypeId]);

  // Submit score when modal opens (only once, and not for archive games)
  useEffect(() => {
    if (
      visible &&
      currentPhaseId === "complete" &&
      gameResults &&
      !gameResults.tracked &&
      currentItem &&
      gameConfig &&
      !isArchiveMode  // Don't submit scores for archive games
    ) {
      submitScoreToLeaderboard();
    }
  }, [visible, currentPhaseId, gameResults, currentItem, gameConfig, isArchiveMode]);

  const submitScoreToLeaderboard = async () => {
    if (!gameResults || !currentItem || !gameConfig || !currentGameTypeId) return;

    setLeaderboardLoading(true);
    setLeaderboardError(null);

    try {
      // Extract phase scores
      const phaseScores: Record<string, number> = {};
      const unifiedResults = gameResults as any;
      (unifiedResults.phaseResults || []).forEach((pr: any) => {
        phaseScores[pr.phaseId as string] = pr.score;
      });

      // Use game-specific scoreSubmitter if provided
      if (gameConfig.scoreSubmitter) {
        const stats = await gameConfig.scoreSubmitter.submit(
          unifiedResults.phaseResults || [],
          currentItem,
          () => {
            const newStreak =
              currentGameTypeId === "italian-pasta"
                ? updatePastaStreak()
                : currentGameTypeId === "food-for-thought"
                  ? updateStreak()
                  : 0;
            setStreak(newStreak);
            return newStreak;
          }
        );
        setLeaderboardStats(stats);
        markGameTracked();
      } else {
        console.warn(`No scoreSubmitter configured for game: ${currentGameTypeId}`);
      }

      setLeaderboardLoading(false);
    } catch (error: any) {
      console.error("Failed to submit score:", error);
      setLeaderboardError(error.message || "Failed to submit score");
      setLeaderboardLoading(false);
    }
  };

  if (!visible || currentPhaseId !== "complete" || !currentItem || !gameConfig || !gameResults) {
    return null;
  }

  // Type guard for UnifiedGameResults
  const unifiedResults = gameResults as any;
  const hasAnySuccess = unifiedResults.phaseResults?.some((pr: any) => pr.success) || false;

  // Generate share text based on game type
  const shareText = currentGameTypeId === "italian-pasta"
    ? generatePastaShareText({
        pastaGuesses: (unifiedResults?.phaseResults?.find((p: any) => p.phaseId === "pasta")?.guesses || []) as string[],
        sauceGuesses: (unifiedResults?.phaseResults?.find((p: any) => p.phaseId === "sauce")?.guesses || []) as string[],
        regionGuesses: (phases["region"]?.guessResults || []).map((result: any, idx: number) => ({
          region: (unifiedResults?.phaseResults?.find((p: any) => p.phaseId === "region")?.guesses[idx] || "") as string,
          distance: result?.distance || 0,
          direction: result?.direction || "N",
        })),
        proteinGuesses: (unifiedResults?.phaseResults?.find((p: any) => p.phaseId === "protein")?.guesses || []).map((guess: any) => ({
          guess: guess as number,
          actualProtein: currentItem.proteinPerServing || 0,
        })),
        pasta: currentItem.name,
        sauce: currentItem.sauceName || "",
        region: currentItem.region || "",
        streak,
        pastaAcceptableGuesses: currentItem.acceptableGuesses || [],
        sauceAcceptableGuesses: currentItem.sauceAcceptableGuesses || [],
      })
    : currentGameTypeId === "food-for-thought"
      ? generateShareText({
          dishGuesses: (unifiedResults?.phaseResults?.find((p: any) => p.phaseId === "dish")?.guesses || []) as string[],
          countryGuesses: (phases["country"]?.guessResults || []).map((result: any, idx: number) => ({
            name: (unifiedResults?.phaseResults?.find((p: any) => p.phaseId === "country")?.guesses[idx] || "") as string,
            distance: result?.distance || 0,
            direction: result?.direction || "",
          })),
          proteinGuesses: (unifiedResults?.phaseResults?.find((p: any) => p.phaseId === "protein")?.guesses || []).map((guess: any) => ({
            guess: guess as number,
            actualProtein: currentItem.proteinPerServing || 0,
          })),
          dish: currentItem.name,
          country: currentItem.country,
          streak,
          acceptableGuesses: currentItem.acceptableGuesses || [],
        })
      : `I played ${gameConfig.name}!\n\nTotal Score: ${unifiedResults?.totalScore?.toFixed(1) || 0}/100\n\nPlay at ${typeof window !== "undefined" ? window.location.origin : ""}${gameConfig.urlPath}`;

  const handleCopyResults = async () => {
    posthog.capture("share_score_clicked", {
      game: currentGameTypeId,
    });

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Results copied to clipboard!");
      await unlockArchivesAfterShare();
    } catch {
      toast.error("Failed to copy results");
    }
  };

  const handleSocialShare = async (platform: string) => {
    posthog.capture("shared_to_social", { platform, game: currentGameTypeId });
    setShowSharePopover(false);
    await unlockArchivesAfterShare();
  };

  const handleCopyFromPopover = async () => {
    await handleCopyResults();
    setShowSharePopover(false);
  };

  const unlockArchivesAfterShare = async () => {
    if (!currentGameTypeId) return;

    try {
      const today = new Date();
      const tzOffsetMinutes = today.getTimezoneOffset();
      const localDate = new Date(today.getTime() - tzOffsetMinutes * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // Use game-specific unlock endpoint (already derived at component level)
      const endpoint = archiveConfig.unlockEndpoint;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          localDate,
          tzOffsetMinutes,
        }),
      });

      if (response.ok) {
        // Use unified slice's unlockArchives method for consistent storage
        const unlockArchivesMethod = useGameStore.getState().unlockUnifiedArchives;
        unlockArchivesMethod();
        setArchivesUnlocked(true);
      } else {
        const errorData = await response.json();
        console.warn("Server unlock failed:", errorData);
      }
    } catch (error) {
      console.warn("Archive unlock API failed:", error);
    }
  };

  // Show all phases (including sauce for pasta)
  const displayPhases = unifiedResults?.phaseResults || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-full sm:max-w-md w-full max-h-[90vh] overflow-y-auto gap-4 flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold">
              {hasAnySuccess ? "🎉 You did it!" : "😅 Good try!"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl sm:text-xl px-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          {(currentGameTypeId === "italian-pasta" || currentGameTypeId === "food-for-thought") && streak >= 1 && (
            <div className="text-orange-500 font-semibold text-sm mt-2 animate-streak-pop">
              🔥 You&apos;re on a {streak}-day streak!
            </div>
          )}
        </div>

        {/* Image */}
        {(() => {
          // For pasta, show sauce image (pasta with sauce); for other games, show main image
          const imageUrl = currentGameTypeId === "italian-pasta"
            ? (currentItem as any).sauceImageUrl || currentItem.imageUrl
            : currentItem.imageUrl;

          return imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${currentItem.name} image`}
              width={400}
              height={208}
              className="rounded-lg w-full object-cover max-h-52"
            />
          ) : (
            <Image
              src="/images/404.png"
              alt="Fallback image"
              width={400}
              height={208}
              className="rounded-lg w-full object-cover max-h-52"
            />
          );
        })()}

        {/* Item Name and Origin */}
        <div>
          <p className="text-base sm:text-lg">
            {currentGameTypeId === "italian-pasta" ? "The pasta was:" : "The dish was:"}
          </p>
          <p className="font-bold text-lg sm:text-xl mt-2 break-words">
            {currentItem.name}
          </p>
          {currentItem.country && <p className="text-gray-600">from {currentItem.country}</p>}
          {currentItem.region && <p className="text-gray-600">from {currentItem.region}, Italy</p>}
        </div>

        {/* Phase Summary */}
        <div className="space-y-2">
          {displayPhases.map((phaseResult: any) => {
            const phaseConfig = gameConfig.phases.find((p) => p.id === phaseResult.phaseId);
            if (!phaseConfig) return null;

            return (
              <div key={phaseResult.phaseId} className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                <span className="text-gray-700">
                  {phaseResult.phaseId.charAt(0).toUpperCase() + phaseResult.phaseId.slice(1)} phase:
                </span>
                <span className="font-semibold">
                  {phaseResult.guesses.length} {phaseResult.guesses.length === 1 ? "guess" : "guesses"}
                </span>
                <span className={phaseResult.success ? "text-green-600" : "text-red-600"}>
                  {phaseResult.success ? "✓" : "✗"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Leaderboard Card */}
        {leaderboardLoading && (
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border-2 border-orange-200">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
              <span className="text-gray-600">Calculating your rank...</span>
            </div>
          </div>
        )}

        {leaderboardError && (
          <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
            <p className="text-red-600 text-sm">
              Could not load leaderboard: {leaderboardError}
            </p>
          </div>
        )}

        {leaderboardStats && !leaderboardLoading && (
          <UnifiedLeaderboardCard
            stats={leaderboardStats}
            gameConfig={gameConfig}
            gameResults={gameResults}
          />
        )}

        {/* Archive Status */}
        <ArchiveStatus
          isUnlocked={archivesUnlocked}
          gameRoute={archiveConfig.gameRoute}
          apiPrefix={gameConfig.apiPrefix}
        />

        {/* Action Buttons */}
        <div className="flex justify-between gap-2">
          <Button
            onClick={() => setShowPostGameContent(!showPostGameContent)}
            variant="neutral"
          >
            {showPostGameContent ? "Close" : `${gameConfig.postGameContent.type === "recipe" ? "🍽️" : "📖"} View ${gameConfig.postGameContent.title}`}
          </Button>

          <div className="relative flex-1">
            <Button
              onClick={() => setShowSharePopover(!showSharePopover)}
              variant="share"
              className="animate-shine w-full"
            >
              📋 Share Your Results
            </Button>

            {showSharePopover && (
              <SharePopover
                shareText={shareText}
                onCopy={handleCopyFromPopover}
                onSocialShare={handleSocialShare}
                onClose={() => setShowSharePopover(false)}
              />
            )}
          </div>
        </div>

        {/* Post-Game Content (Recipe/Story) */}
        {showPostGameContent && (
          <PostGameContent
            item={currentItem}
            contentType={gameConfig.postGameContent.type}
            gameConfig={gameConfig}
          />
        )}

        <p className="text-center text-gray-500 text-sm mt-4">
          Come back tomorrow for a new challenge!
        </p>
      </div>
    </div>
  );
};

/**
 * Unified Leaderboard Card Component
 */
interface UnifiedLeaderboardCardProps {
  stats: any;
  gameConfig: any;
  gameResults: any;
}

const UnifiedLeaderboardCard: React.FC<UnifiedLeaderboardCardProps> = ({
  stats,
  gameConfig,
  gameResults,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const totalScore = useCountUp(0, gameResults.totalScore || 0, 1000);
  const percentile = stats?.percentile || 50;
  const rank = stats?.rank || 0;

  const tier = getPerformanceTier(percentile);
  const isTopPerformer = percentile >= 90;
  const displayTitle = getDisplayTitle(rank, percentile);

  // Show all phases including sauce for pasta
  const displayPhases = gameResults.phaseResults;

  return (
    <div
      className={`rounded-lg p-4 border-2 transition-all ${
        isTopPerformer
          ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-lg"
          : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
      }`}
    >
      {/* Main Rank Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-label={tier.name}>
            {tier.emoji}
          </span>
          <div>
            <div className="text-2xl font-bold" style={{ color: tier.color }}>
              {displayTitle}
            </div>
            <div className="text-sm text-gray-600">{tier.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Your Score</div>
          <div className="text-2xl font-bold text-gray-800">
            {totalScore.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Score Breakdown Bars */}
      <div className="space-y-2 mb-3">
        {displayPhases.map((phaseResult: any, index: number) => {
          const phaseConfig = gameConfig.phases.find((p: any) => p.id === phaseResult.phaseId);
          if (!phaseConfig) return null;

          const colors = [
            "bg-orange-500",
            "bg-blue-500",
            "bg-green-500",
            "bg-purple-500",
          ];

          // Simple label: capitalize first letter of phaseId
          const label = phaseResult.phaseId.charAt(0).toUpperCase() + phaseResult.phaseId.slice(1);

          return (
            <ScoreBar
              key={phaseResult.phaseId}
              label={label}
              score={phaseResult.score}
              color={colors[index % colors.length]}
            />
          );
        })}
      </div>

      {/* Expandable Details */}
      <Button
        onClick={() => setShowDetails(!showDetails)}
        variant="ghost"
        className="w-full text-sm"
      >
        {showDetails ? "Hide Details" : "Show Details"}
      </Button>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
          <div className="text-gray-700 font-medium mb-2">Phase Breakdown:</div>
          {displayPhases.map((phaseResult: any) => {
            const phaseConfig = gameConfig.phases.find((p: any) => p.id === phaseResult.phaseId);
            if (!phaseConfig) return null;

            // Simple label format: "Pasta Phase:", "Sauce Phase:", etc.
            const label = phaseResult.phaseId.charAt(0).toUpperCase() + phaseResult.phaseId.slice(1) + " Phase:";

            return (
              <div key={phaseResult.phaseId} className="flex justify-between">
                <span className="text-gray-600">{label}</span>
                <span className="font-semibold">{phaseResult.score} points</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Celebration for top performers */}
      {isTopPerformer && (
        <div className="mt-3 text-center text-sm font-semibold text-yellow-700 animate-pulse">
          🎉 Outstanding performance! 🎉
        </div>
      )}
    </div>
  );
};

interface ScoreBarProps {
  label: string;
  score: number;
  color: string;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, score, color }) => {
  const animatedScore = useCountUp(0, score, 800);

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-semibold">{Math.round(animatedScore)}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${animatedScore}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Post-Game Content Component (Recipe/Story)
 */
interface PostGameContentProps {
  item: any;
  contentType: "recipe" | "story" | "facts";
  gameConfig: any;
}

const PostGameContent: React.FC<PostGameContentProps> = ({
  item,
  contentType,
  gameConfig,
}) => {
  if (contentType === "recipe") {
    // For pasta, show sauce recipe; for other games, show item.recipe
    const isPasta = gameConfig.id === "italian-pasta";
    const recipeName = isPasta ? (item as any).sauceName : item.name;
    const ingredients = isPasta ? (item as any).sauceIngredients : item.recipe?.ingredients;
    const instructions = isPasta ? (item as any).sauceInstructions : item.recipe?.instructions;
    const origin = isPasta ? (item as any).region : item.country;

    if (!ingredients || !instructions) return null;

    return (
      <div className="relative p-4">
        <span className="absolute text-[120px] opacity-10 right-5 select-none pointer-events-none">
          👨🏻‍🍳
        </span>

        <div className="text-2xl font-bold">🍽️ {recipeName}</div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto relative z-10">
          <div>
            <p className="text-gray-600 text-sm mb-2 italic">
              Here&apos;s how you make {recipeName} — straight from {origin}{isPasta ? ", Italy" : ""}.
            </p>
            <p className="font-semibold">Ingredients:</p>
            <ul className="list-disc list-inside text-gray-700">
              {ingredients.map((ingredient: string, idx: number) => (
                <li key={idx}>{ingredient}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Instructions:</p>
            <ol className="list-decimal list-inside text-gray-700 space-y-1">
              {instructions.map((step: string, idx: number) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (contentType === "story" && item.origin) {
    return (
      <div className="relative p-4">
        <span className="absolute text-[120px] opacity-10 right-5 select-none pointer-events-none">
          📖
        </span>

        <div className="text-2xl font-bold">📖 The Story of {item.name}</div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto relative z-10">
          <p className="text-gray-700 leading-relaxed">{item.origin}</p>
        </div>
      </div>
    );
  }

  return null;
};
