"use client";

import { useGameStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { getCuisineRegion } from "@/data/cuisineRegions";
import { RegionHintChip } from "./RegionHintChip";

export const GuessFeedback = () => {
  const { currentDish, gamePhase, revealedIngredients, dishGuesses } = useGameStore();

  if (!currentDish) return null;

  const showIngredientHints =
    gamePhase !== "country" && revealedIngredients >= 1;

  const isDishPhase = gamePhase === "dish";
  const region = isDishPhase ? getCuisineRegion(currentDish.country) : null;
  const showRegionHint =
    isDishPhase && dishGuesses.length >= 3 && region !== null;

  // Early return only when there's truly nothing to show.
  if (!showIngredientHints && !showRegionHint) return null;

  return (
    <div className="flex flex-col gap-2">
      {showIngredientHints && revealedIngredients > 1 && (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-600">Revealed Ingredients:</div>
          <div className="flex flex-wrap gap-1">
            <AnimatePresence initial={false}>
              {currentDish.ingredients
                .slice(0, revealedIngredients - 1)
                .map((ingredient, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded border border-amber-300 list-none"
                  >
                    {ingredient}
                  </motion.li>
                ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {showRegionHint && region && <RegionHintChip region={region} />}
    </div>
  );
};
