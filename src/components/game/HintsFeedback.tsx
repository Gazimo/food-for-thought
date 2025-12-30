"use client";

import { AnimatePresence, motion } from "framer-motion";

interface HintsFeedbackProps {
  hints: string[];
  hintsRevealed: number;
  label?: string;
  isPhaseComplete?: boolean;
}

export const HintsFeedback = ({
  hints,
  hintsRevealed,
  label = "Revealed Hints",
  isPhaseComplete = false,
}: HintsFeedbackProps) => {
  if (hints.length === 0 || hintsRevealed === 0) return null;
  if (isPhaseComplete) return null;

  const visibleHints = hints.slice(0, hintsRevealed);

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="flex flex-wrap gap-1">
        <AnimatePresence initial={false}>
          {visibleHints.map((hint, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded border border-amber-300"
            >
              {hint}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
