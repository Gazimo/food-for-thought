"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGameStore } from "@/store";
import Image from "next/image";
import posthog from "posthog-js";
import React, { memo, useState } from "react";
import { toast } from "react-hot-toast";
import { generateShareText } from "../utils/shareText";
import { alreadyPlayedToday } from "../utils/streak";
import { ArchiveStatus } from "./ArchiveStatus";
import { GameSummary } from "./GameSummary";
import { LeaderboardCard } from "./LeaderboardCard";
import { SharePopover } from "./SharePopover";

export const ResultModal: React.FC = memo(function ResultModal() {
  const {
    currentDish,
    gamePhase,
    gameResults,
    modalVisible,
    toggleModal,
    streak,
    countryGuessResults,
    unlockArchives,
    isArchivesUnlockedNow,
    isPlayingArchive,
    archiveDate,
    submitScore,
    leaderboardStats,
  } = useGameStore();
  const [showRecipe, setShowRecipe] = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = React.useState(false);

  // Submit score when modal opens (only once)
  React.useEffect(() => {
    if (
      gamePhase === "complete" &&
      currentDish &&
      modalVisible &&
      !scoreSubmitted &&
      !leaderboardStats
    ) {
      submitScore(gameResults, currentDish);
      setScoreSubmitted(true);
    }
  }, [
    gamePhase,
    currentDish,
    modalVisible,
    scoreSubmitted,
    leaderboardStats,
    submitScore,
    gameResults,
  ]);

  if (gamePhase !== "complete" || !currentDish) return null;

  const shareText = generateShareText({
    dishGuesses: gameResults.dishGuesses,
    countryGuesses: countryGuessResults.map((g) => ({
      name: g.country,
      distance: g.distance,
      direction: g.direction,
    })),
    proteinGuesses: gameResults.proteinGuesses.map((guess) => ({
      guess,
      actualProtein: currentDish?.proteinPerServing || 0,
    })),
    dish: currentDish.name,
    country: currentDish.country,
    streak,
    acceptableGuesses: currentDish.acceptableGuesses || [],
    archiveDate: isPlayingArchive ? archiveDate : undefined,
  });
  const handleCopyResults = async () => {
    posthog.capture("share_score_clicked", {
      mode: alreadyPlayedToday() ? "daily" : "freeplay",
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
    posthog.capture("shared_to_social", { platform });
    setShowSharePopover(false);
    await unlockArchivesAfterShare();
  };

  const handleCopyFromPopover = async () => {
    await handleCopyResults();
    setShowSharePopover(false);
  };

  const unlockArchivesAfterShare = async () => {
    try {
      const today = new Date();
      const tzOffsetMinutes = today.getTimezoneOffset();
      const localDate = new Date(today.getTime() - tzOffsetMinutes * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const response = await fetch("/api/archive-unlock", {
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
        // Server unlock successful, also update client state
        unlockArchives();
      } else {
        const errorData = await response.json();
        console.warn("Server unlock failed:", errorData);
        // Still unlock client-side for UX
        unlockArchives();
      }
    } catch (error) {
      console.warn("Archive unlock API failed:", error);
      // Still unlock client-side for UX
      unlockArchives();
    }
  };

  return (
    <Dialog
      open={modalVisible}
      onOpenChange={(open) => {
        if (!open) {
          toggleModal(false);
          setShowRecipe(false);
          setShowSharePopover(false);
          posthog.capture("toggle_recipe_modal", { opened: false });
        }
      }}
    >
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="max-w-md w-full max-h-[90vh] overflow-y-auto gap-4 flex flex-col p-4 sm:p-6"
      >
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            🎉 You did it!
          </DialogTitle>
          {streak >= 1 && (
            <div className="text-orange-500 font-semibold text-sm mt-2 animate-streak-pop">
              🔥 You&apos;re on a {streak}-day streak!
            </div>
          )}
        </div>
        <DialogDescription className="sr-only">
          Game results for {currentDish.name} from {currentDish.country}.
        </DialogDescription>
        {currentDish.imageUrl ? (
          <Image
            src={currentDish.imageUrl}
            alt="Dish image"
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
        )}

        <div>
          <p className="text-base sm:text-lg">The dish was:</p>
          <p className="font-bold text-lg sm:text-xl mt-2 break-words">
            {currentDish.name}
          </p>
          <p className="text-gray-600">from {currentDish.country}</p>
        </div>

        <GameSummary gameResults={gameResults} currentDish={currentDish} />

        <LeaderboardCard />

        <ArchiveStatus isUnlocked={isArchivesUnlockedNow()} />

        <div className="flex justify-between gap-2">
          <Button onClick={() => setShowRecipe(!showRecipe)} variant="neutral">
            {showRecipe ? "Close" : "🍽️ View Recipe"}
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

        {currentDish.recipe && (
          <>
            {showRecipe && (
              <div className="relative p-4">
                <span className="absolute text-[120px] opacity-10 right-5 select-none pointer-events-none">
                  👨🏻‍🍳
                </span>

                <div className="text-2xl font-bold">🍽️ {currentDish.name}</div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto relative z-10">
                  <div>
                    <p className="text-gray-600 text-sm mb-2 italic">
                      Here&apos;s how you make {currentDish.name} — straight
                      from {currentDish.country}.
                    </p>
                    <p className="font-semibold">Ingredients:</p>
                    <ul className="list-disc list-inside text-gray-700">
                      {currentDish.recipe.ingredients.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold">Instructions:</p>
                    <ol className="list-decimal list-inside text-gray-700 space-y-1">
                      {currentDish.recipe.instructions.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <p className="text-center text-gray-500 text-sm mt-4">
          Come back tomorrow for a new challenge!
        </p>
      </DialogContent>
    </Dialog>
  );
});
