"use client";

import { motion } from "framer-motion";
import React from "react";

interface RegionHintChipProps {
  region: string;
}

export const RegionHintChip: React.FC<RegionHintChipProps> = ({ region }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative inline-flex items-center gap-2 self-start mt-2 px-3 py-1.5 rounded-full border border-indigo-300 bg-indigo-50 text-indigo-800 text-sm font-medium overflow-hidden animate-hint-glow"
    >
      <span aria-hidden>💡</span>
      <span>
        <span className="opacity-70 mr-1">Hint:</span>
        {region}
      </span>
      <span className="absolute inset-0 pointer-events-none animate-hint-shimmer" />
    </motion.div>
  );
};
