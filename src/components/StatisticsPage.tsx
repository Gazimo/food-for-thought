"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { useGameStore } from "@/store";
import { getDisplayTitle, getPerformanceTier } from "@/types/leaderboard";
import Link from "next/link";
import posthog from "posthog-js";
import React, { useEffect } from "react";
import { StatisticsAnnouncementModal } from "./StatisticsAnnouncementModal";
import { Button } from "./ui/button";

export const StatisticsPage: React.FC = () => {
  const {
    statisticsData,
    statisticsLoading,
    statisticsError,
    fetchStatistics,
    loadStatisticsFromStorage,
    isPlayingArchive,
    showStatsAnnouncement,
    checkStatsAnnouncement,
    markStatsAnnouncementSeen,
  } = useGameStore();

  useEffect(() => {
    // Check if we should show announcement
    checkStatsAnnouncement();

    // Load from storage first
    loadStatisticsFromStorage();

    // Then fetch fresh data
    fetchStatistics();

    // Track page view
    posthog.capture("statistics_viewed");
  }, [fetchStatistics, loadStatisticsFromStorage, checkStatsAnnouncement]);

  // Handle announcement close
  const handleAnnouncementClose = () => {
    markStatsAnnouncementSeen();
    // Optionally navigate to statistics
  };

  // Don't show statistics page in archive mode
  if (isPlayingArchive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              📊 Statistics
            </h1>
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <p className="text-gray-700 mb-2">
                Statistics are only available for today&apos;s game.
              </p>
              <p className="text-gray-600 text-sm">
                Archive games are for practice and don&apos;t count toward your
                stats.
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

  if (statisticsLoading && !statisticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="text-xl text-gray-600">
                Loading statistics...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (statisticsError && !statisticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              📊 Statistics
            </h1>
            <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
              <p className="text-red-600 mb-4">{statisticsError}</p>
              <p className="text-gray-600 text-sm">
                Complete today&apos;s game to start tracking your stats!
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

  if (!statisticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              📊 Statistics
            </h1>
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <p className="text-gray-700 mb-2">
                Complete today&apos;s game to start tracking your stats!
              </p>
              <p className="text-gray-600 text-sm">
                Your progress, streaks, and scores will be tracked here.
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

  const hasTodayPerformance = !!statisticsData.todayPerformance;

  return (
    <>
      <StatisticsAnnouncementModal
        isOpen={showStatsAnnouncement}
        onClose={handleAnnouncementClose}
      />

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
              📊 Your Statistics
            </h1>
            <p className="text-gray-600">Track your progress and improvement</p>
          </div>

          {/* Personal Statistics */}
          <UserStatsCard stats={statisticsData.userStats} />

          {/* Today's Performance (if played today) */}
          {hasTodayPerformance && statisticsData.todayPerformance && (
            <TodayPerformanceCard
              performance={statisticsData.todayPerformance}
              playerCount={statisticsData.totalPlayersToday}
            />
          )}

          {/* Today's Score Distribution (if played today) */}
          {hasTodayPerformance && statisticsData.scoreDistribution && (
            <ScoreDistributionChart
              distribution={statisticsData.scoreDistribution}
            />
          )}

          {/* Play Today CTA (if haven't played) */}
          {!hasTodayPerformance && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🎮</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Play Today&apos;s Game
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  See how you rank against other players today!
                </p>
                <Link href="/play">
                  <Button className="w-full">Play Now</Button>
                </Link>
              </div>
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
                  <strong>Dish Phase:</strong> Use ingredient hints
                  strategically before making guesses
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
    </>
  );
};

// User Stats Card Component
interface UserStatsCardProps {
  stats: {
    currentStreak: number;
    bestStreak: number;
    totalGames: number;
    averageScore: number;
    bestScore: number;
  };
}

const UserStatsCard: React.FC<UserStatsCardProps> = ({ stats }) => {
  const currentStreak = useCountUp(0, stats.currentStreak, 800);
  const bestStreak = useCountUp(0, stats.bestStreak, 800);
  const totalGames = useCountUp(0, stats.totalGames, 800);
  const avgScore = useCountUp(0, stats.averageScore, 1000);
  const bestScore = useCountUp(0, stats.bestScore, 1000);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Your Statistics</h2>
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon="🔥"
          label="Current Streak"
          value={`${Math.round(currentStreak)} days`}
          highlight={stats.currentStreak >= 3}
        />
        <StatCard
          icon="🏆"
          label="Best Streak"
          value={`${Math.round(bestStreak)} days`}
        />
        <StatCard
          icon="🎮"
          label="Games Played"
          value={Math.round(totalGames).toString()}
        />
        <StatCard icon="📈" label="Average Score" value={avgScore.toFixed(1)} />
      </div>
      <div className="mt-4">
        <StatCard
          icon="⭐"
          label="Personal Best"
          value={bestScore.toFixed(1)}
          highlight={stats.bestScore >= 80}
          fullWidth
        />
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
  fullWidth?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  highlight = false,
  fullWidth = false,
}) => {
  return (
    <div
      className={`${
        highlight
          ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300"
          : "bg-gray-50 border-2 border-gray-200"
      } rounded-lg p-4 ${fullWidth ? "col-span-2" : ""}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
};

// Today's Performance Card
interface TodayPerformanceCardProps {
  performance: {
    dishScore: number;
    countryScore: number;
    proteinScore: number;
    totalScore: number;
    percentile: number;
    rank?: number;
  };
  playerCount: number;
}

const TodayPerformanceCard: React.FC<TodayPerformanceCardProps> = ({
  performance,
  playerCount,
}) => {
  const tier = getPerformanceTier(performance.percentile);
  const displayTitle = getDisplayTitle(
    playerCount,
    performance.rank || 1,
    performance.percentile
  );
  const totalScore = useCountUp(0, performance.totalScore, 1000);
  const isTopPerformer = performance.percentile >= 90;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Today&apos;s Performance
      </h2>
      <div
        className={`rounded-lg p-6 border-2 ${
          isTopPerformer
            ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300"
            : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
        }`}
      >
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
              {totalScore.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <ScoreBar
            label="Dish"
            score={performance.dishScore}
            color="bg-orange-500"
          />
          <ScoreBar
            label="Country"
            score={performance.countryScore}
            color="bg-blue-500"
          />
          <ScoreBar
            label="Protein"
            score={performance.proteinScore}
            color="bg-green-500"
          />
        </div>

        {isTopPerformer && (
          <div className="mt-4 text-center text-sm font-semibold text-yellow-700 animate-pulse">
            🎉 Exceptional Performance! 🎉
          </div>
        )}
      </div>
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

// Score Distribution Chart
interface ScoreDistributionChartProps {
  distribution: {
    buckets: {
      range: string;
      count: number;
      hasUser: boolean;
    }[];
    userScore: number;
    userRank: number;
    totalPlayers: number;
  };
}

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  distribution,
}) => {
  const maxCount = Math.max(...distribution.buckets.map((b) => b.count));
  const userBucket = distribution.buckets.find((b) => b.hasUser);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Today&apos;s Score Distribution
        </h2>
        <p className="text-sm text-gray-600">
          See how your score compares to other players today
        </p>
      </div>

      {/* Chart */}
      <div className="space-y-3 mb-6">
        {distribution.buckets.map((bucket) => {
          const heightPercent =
            maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
          const isUserBucket = bucket.hasUser;

          return (
            <div key={bucket.range} className="flex items-center gap-3">
              {/* Range Label */}
              <div className="w-16 text-sm font-medium text-gray-600 text-right">
                {bucket.range}
              </div>

              {/* Bar */}
              <div className="flex-1 relative">
                <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isUserBucket
                        ? "bg-gradient-to-r from-orange-400 to-yellow-400"
                        : "bg-gradient-to-r from-blue-300 to-blue-400"
                    }`}
                    style={{ width: `${heightPercent}%` }}
                  />
                </div>

                {/* User Marker */}
                {isUserBucket && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      YOU
                    </span>
                    <span className="text-lg">👤</span>
                  </div>
                )}
              </div>

              {/* Count */}
              <div className="w-12 text-sm font-semibold text-gray-700">
                {bucket.count > 0 ? bucket.count : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {distribution.userScore.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">Your Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            {userBucket?.range || "N/A"}
          </div>
          <div className="text-xs text-gray-600">Score Range</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-300 to-blue-400" />
          <span>Other Players</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-orange-400 to-yellow-400" />
          <span>Your Score</span>
        </div>
      </div>
    </div>
  );
};
