"use client";

import { Button } from "@/components/ui/button";
import React from "react";

interface StatisticsAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatisticsAnnouncementModal: React.FC<
  StatisticsAnnouncementModalProps
> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="text-center mb-4">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            New Feature: Statistics!
          </h2>
        </div>

        <div className="space-y-3 text-gray-700 mb-6">
          <p className="text-center">
            Track your progress and see how you stack up!
          </p>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-sm">Track your daily streak</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📈</span>
              <span className="text-sm">See your average score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <span className="text-sm">Compare with today&apos;s top scores</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <span className="text-sm">View your personal best</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center">
            Your stats are tracked from today onwards. Keep playing to build
            your history!
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          Got it! Show me my stats
        </Button>
      </div>
    </div>
  );
};

