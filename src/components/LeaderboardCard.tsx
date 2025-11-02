"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { useGameStore } from "@/store";
import { getDisplayTitle, getPerformanceTier } from "@/types/leaderboard";
import React, { useState } from "react";
import { Button } from "./ui/button";

export const LeaderboardCard: React.FC = () => {
  const {
    leaderboardStats,
    leaderboardLoading,
    leaderboardError,
    isPlayingArchive,
  } = useGameStore();
  const [showDetails, setShowDetails] = useState(false);

  const totalScore = useCountUp(
    0,
    leaderboardStats?.todayRank.totalScore || 0,
    1000
  );

  if (isPlayingArchive) {
    return null;
  }

  if (leaderboardLoading) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border-2 border-orange-200">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
          <span className="text-gray-600">Calculating your rank...</span>
        </div>
      </div>
    );
  }

  if (leaderboardError) {
    return (
      <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
        <p className="text-red-600 text-sm">
          Could not load leaderboard: {leaderboardError}
        </p>
      </div>
    );
  }

  if (!leaderboardStats) {
    return null;
  }

  const tier = getPerformanceTier(leaderboardStats.todayRank.percentile);
  const isTopPerformer = leaderboardStats.todayRank.percentile >= 90;

  const displayTitle = getDisplayTitle(
    leaderboardStats.todayRank.rank || 1,
    leaderboardStats.todayRank.percentile
  );

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
        <ScoreBar
          label="Dish"
          score={leaderboardStats.todayRank.dishScore}
          color="bg-orange-500"
        />
        <ScoreBar
          label="Country"
          score={leaderboardStats.todayRank.countryScore}
          color="bg-blue-500"
        />
        <ScoreBar
          label="Protein"
          score={leaderboardStats.todayRank.proteinScore}
          color="bg-green-500"
        />
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
          <div className="flex justify-between">
            <span className="text-gray-600">Dish Phase:</span>
            <span className="font-semibold">
              {leaderboardStats.todayRank.dishScore} points
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Country Phase:</span>
            <span className="font-semibold">
              {leaderboardStats.todayRank.countryScore} points
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Protein Phase:</span>
            <span className="font-semibold">
              {leaderboardStats.todayRank.proteinScore} points
            </span>
          </div>
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
