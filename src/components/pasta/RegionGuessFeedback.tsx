"use client";

import { RegionGuessResult } from "@/types/pasta";
import {
  getColorClassForItalyDistance,
  getDirectionArrow,
} from "@/utils/italyColors";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface RegionGuessFeedbackProps {
  guessResults: RegionGuessResult[];
}

/**
 * Hook for animated distance counter
 */
const useCountUp = (start: number, end: number, duration: number) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * (end - start) + start));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [start, end, duration]);

  return count;
};

export const RegionGuessFeedback = ({
  guessResults,
}: RegionGuessFeedbackProps) => {
  // Get the last guess (most recent) - default to avoid hook conditional
  const lastGuess = guessResults[guessResults.length - 1] || { distance: 0 };
  const animatedDistance = useCountUp(0, Math.round(lastGuess.distance), 1000);

  if (guessResults.length === 0) return null;

  // Sort previous guesses by distance (closest first)
  const previousGuesses = [...guessResults.slice(0, -1)].sort((a, b) => {
    if (isNaN(a.distance)) return 1;
    if (isNaN(b.distance)) return -1;
    return a.distance - b.distance;
  });

  const renderGuess = (
    result: RegionGuessResult,
    animated = false,
    index: number
  ) => {
    const distanceValue =
      animated && !result.isCorrect
        ? animatedDistance
        : Math.round(result.distance);

    return (
      <motion.div
        key={result.region + result.distance + index}
        initial={animated ? { opacity: 0, y: 10 } : false}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={animated ? { duration: 0.3 } : undefined}
        className={`p-3 rounded-lg border ${
          result.isCorrect ? "border-green-500 bg-green-50" : "border-gray-200"
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium">{result.region}</span>
          {result.isCorrect ? (
            <span className="text-green-600 font-semibold">✓ Correct!</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {distanceValue.toLocaleString()} km
              </span>
              <span className="text-sm flex items-center justify-center">
                {getDirectionArrow(result.direction)}
              </span>
              <div
                className={`w-4 h-4 rounded-full ${getColorClassForItalyDistance(
                  result.distance
                )}`}
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <h3 className="font-semibold text-lg mb-2">Your Guesses:</h3>
      <div className="space-y-2">
        {renderGuess(lastGuess, true, -1)}
        {previousGuesses.map((g, i) => renderGuess(g, false, i))}
      </div>
    </>
  );
};
