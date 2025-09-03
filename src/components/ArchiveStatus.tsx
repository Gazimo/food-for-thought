"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import { toast } from "react-hot-toast";

interface ArchiveStatusProps {
  isUnlocked: boolean;
}

export const ArchiveStatus: React.FC<ArchiveStatusProps> = ({ isUnlocked }) => {
  if (isUnlocked) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
        <div className="text-center mb-3">
          <p className="text-sm text-green-800 font-medium">
            🏛️ Archives unlocked!
          </p>
          <p className="text-xs text-green-600 mt-1">
            You can now play previous games
          </p>
        </div>
        <Button
          onClick={() => {
            // TODO: Open date picker modal
            toast.success("Archive feature coming soon!");
          }}
          variant="secondary"
          className="w-full bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
        >
          📅 Play Archived Games
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col
     bg-gradient-to-r
      from-pink-100 
      to-purple-100 border border-purple-200 rounded-lg p-1 text-center animate-pulse">
      <p className="text-sm text-purple-600  font-medium animate-pulse">
        Wanna play more?
      </p>
      <p className="text-sm text-purple-600 font-medium animate-pulse">
        Share your results to unlock the archives!
      </p>
    </div>
  );
};
