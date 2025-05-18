"use client";

import { useGameStore } from "@/store/gameStore";
import { AnimatePresence, motion } from "framer-motion";

interface GuessFeedbackProps {
  alwaysShowIngredients?: boolean;
}

export const GuessFeedback = ({
  alwaysShowIngredients = false,
}: GuessFeedbackProps) => {
  const { currentDish, gamePhase, revealedIngredients } = useGameStore();

  if (!currentDish) return null;

  // Don't show ingredients section if no ingredients are revealed yet
  if (
    !alwaysShowIngredients &&
    gamePhase === "dish" &&
    revealedIngredients <= 1
  )
    return null;

  return (
    <div className="mt-4">
      {(gamePhase === "dish" || alwaysShowIngredients) && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Revealed Ingredients:</h3>
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {currentDish.ingredients
                .slice(0, revealedIngredients - 1) // Subtract 1 since we start with 1 but no ingredients
                .map((ingredient, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full inline-block mr-2 mb-2"
                  >
                    {ingredient}
                  </motion.li>
                ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {gamePhase === "country" && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Dish: {currentDish.name}</h3>
          <p className="text-gray-700">{currentDish.blurb}</p>
        </div>
      )}
    </div>
  );
};
