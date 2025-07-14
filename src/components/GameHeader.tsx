"use client";

import { HelpCircle } from "lucide-react";

interface GameHeaderProps {
  onShowRules: () => void;
}

export function GameHeader({ onShowRules }: GameHeaderProps) {
  return (
    <header className="w-full flex justify-between items-center">
      <h1 className="text-xl font-bold text-orange-600">Food for Thought</h1>
      <HelpCircle className="cursor-pointer" onClick={onShowRules} />
    </header>
  );
}
