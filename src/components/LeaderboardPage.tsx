"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { useGameStore } from "@/store";
import { getPerformanceTier } from "@/types/leaderboard";
import Link from "next/link";
import posthog from "posthog-js";
import React, { useEffect } from "react";
import { Button } from "./ui/button";

export const LeaderboardPage: React.FC = () => {
  const {
    leaderboardStats,
    leaderboardLoading,
    leaderboardError,
    fetchLeaderboardStats,
    loadLeaderboardFromStorage,
    isPlayingArchive,
  } = useGameStore();

  // Don't show leaderboard page in archive mode
  if (isPlayingArchive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Leaderboard
            </h1>
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <p className="text-gray-700 mb-2">
                Leaderboard is only available for today&apos;s game.
              </p>
              <p className="text-gray-600 text-sm">
                Archive games are for practice and don&apos;t count toward
                rankings.
              </p>
            </div>
            <Link href="/play">
              <Button className="w-full mt-4">Back to Game</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Try to load from storage first
    loadLeaderboardFromStorage();

    // Then fetch fresh data
    fetchLeaderboardStats();

    // Track page view
    posthog.capture("leaderboard_viewed");
  }, [fetchLeaderboardStats, loadLeaderboardFromStorage]);

  if (leaderboardLoading && !leaderboardStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="text-xl text-gray-600">
                Loading leaderboard...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (leaderboardError && !leaderboardStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Leaderboard
            </h1>
            <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
              <p className="text-red-600 mb-4">{leaderboardError}</p>
              <p className="text-gray-600 text-sm">
                Complete today&apos;s game to see your ranking!
              </p>
            </div>
            <Link href="/play">
              <Button className="w-full mt-4">Play Today&apos;s Game</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboardStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Leaderboard
            </h1>
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <p className="text-gray-700 mb-2">
                Complete today&apos;s game to see your ranking!
              </p>
              <p className="text-gray-600 text-sm">
                Your performance will be compared with players around the world.
              </p>
            </div>
            <Link href="/play">
              <Button className="w-full mt-4">Play Today&apos;s Game</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const todayTier = getPerformanceTier(leaderboardStats.todayRank.percentile);
  const overallTier = getPerformanceTier(
    leaderboardStats.overallRank?.percentile || 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-4">
      <div className="max-w-2xl mx-auto pt-8 pb-20">
        {/* Header */}
        <div className="mb-6">
          <Link href="/play">
            <Button variant="ghost" className="mb-4">
              ← Back to Game
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-600">
            See how you rank against players worldwide
          </p>
        </div>

        {/* Today's Performance */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Today&apos;s Performance
          </h2>
          <RankCard
            tier={todayTier}
            percentile={leaderboardStats.todayRank.percentile}
            score={leaderboardStats.todayRank.totalScore}
            dishScore={leaderboardStats.todayRank.dishScore}
            countryScore={leaderboardStats.todayRank.countryScore}
            proteinScore={leaderboardStats.todayRank.proteinScore}
            playerCount={leaderboardStats.totalPlayersToday}
            rank={leaderboardStats.todayRank.rank || 1}
          />
        </div>

        {/* Overall Performance */}
        {leaderboardStats.overallRank && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Overall Ranking
            </h2>
            <RankCard
              tier={overallTier}
              percentile={leaderboardStats.overallRank.percentile}
              score={leaderboardStats.overallRank.totalScore}
              dishScore={leaderboardStats.overallRank.dishScore}
              countryScore={leaderboardStats.overallRank.countryScore}
              proteinScore={leaderboardStats.overallRank.proteinScore}
              playerCount={leaderboardStats.totalPlayersToday}
              rank={leaderboardStats.overallRank.rank || 1}
              isOverall
            />
          </div>
        )}

        {/* Performance Tips */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            💡 Performance Tips
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>
                <strong>Dish Phase:</strong> Use ingredient hints strategically
                before making guesses
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>
                <strong>Country Phase:</strong> Consider regional cuisines and
                use geographic clues
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              <span>
                <strong>Protein Phase:</strong> Think about typical serving
                sizes and main ingredients
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

interface RankCardProps {
  tier: ReturnType<typeof getPerformanceTier>;
  percentile: number;
  score: number;
  dishScore: number;
  countryScore: number;
  proteinScore: number;
  playerCount: number;
  rank: number;
  isOverall?: boolean;
}

const RankCard: React.FC<RankCardProps> = ({
  tier,
  percentile,
  score,
  dishScore,
  countryScore,
  proteinScore,
  playerCount,
  rank,
  isOverall = false,
}) => {
  const animatedPercentile = useCountUp(0, percentile, 1000);
  const animatedScore = useCountUp(0, score, 1000);
  const isTopPerformer = percentile >= 90;

  // Import getDisplayTitle for smart title display
  const { getDisplayTitle } = require("@/types/leaderboard");
  const displayTitle = getDisplayTitle(playerCount, rank, percentile);

  return (
    <div
      className={`rounded-lg p-6 border-2 ${
        isTopPerformer
          ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300"
          : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
      }`}
    >
      {/* Main Stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{tier.emoji}</span>
          <div>
            <div className="text-3xl font-bold" style={{ color: tier.color }}>
              {displayTitle}
            </div>
            <div className="text-lg text-gray-600">{tier.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Score</div>
          <div className="text-3xl font-bold text-gray-800">
            {animatedScore.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3 mb-4">
        <ScoreBreakdownBar
          label="Dish"
          score={dishScore}
          color="bg-orange-500"
        />
        <ScoreBreakdownBar
          label="Country"
          score={countryScore}
          color="bg-blue-500"
        />
        <ScoreBreakdownBar
          label="Protein"
          score={proteinScore}
          color="bg-green-500"
        />
      </div>

      {isTopPerformer && (
        <div className="mt-4 text-center text-sm font-semibold text-yellow-700 animate-pulse">
          🎉 Exceptional Performance! 🎉
        </div>
      )}
    </div>
  );
};

interface ScoreBreakdownBarProps {
  label: string;
  score: number;
  color: string;
}

const ScoreBreakdownBar: React.FC<ScoreBreakdownBarProps> = ({
  label,
  score,
  color,
}) => {
  const animatedScore = useCountUp(0, score, 800);

  return (
    <div>
      <div className="flex justify-between text-sm text-gray-700 mb-1">
        <span className="font-medium">{label}</span>
        <span className="font-bold">{Math.round(animatedScore)}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${animatedScore}%` }}
        />
      </div>
    </div>
  );
};
