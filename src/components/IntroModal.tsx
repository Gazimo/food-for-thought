"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: string;
  headerImage?: string;
  headerImageAlt?: string;
  subtitle?: string;
}

// TODO: FIX THIS UGLY THING
const GAME_CONFIGS: Record<string, { steps: { emoji: string; label: string; text: string }[] }> = {
  "italian-pasta": {
    steps: [
      { emoji: "🍝", label: "Guess the pasta", text: "You'll see a blurred image of an Italian Pasta. Plain, no sauce. With each incorrect guess, the image will become a little clearer." },
      { emoji: "🍅", label: "Guess the sauce", text: "You'll see a blurred image of the pasta in its traditional sauce that goes with it. With each incorrect guess... you get the idea." },
      { emoji: "🇮🇹", label: "Guess the region", text: "Once you've completed guessing the pasta dish, guess its region of origin in Italy." },
      { emoji: "💪", label: "Guess the protein", text: "You have 4 tries to guess the protein per serving." },
    ],
  },
  default: {
    steps: [
      { emoji: "🍔", label: "Guess the dish", text: "You'll see a blurred image of a food dish. With each incorrect guess, the image will become a little clearer." },
      { emoji: "🌍", label: "Guess the country", text: "Once you've guessed the dish, guess its country of origin." },
      { emoji: "💪", label: "Guess the protein", text: "You have 4 tries to guess the protein per serving." },
    ],
  },
};

export const IntroModal = ({
  isOpen,
  onClose,
  gameId,
  headerImage,
  headerImageAlt,
  subtitle
}: IntroModalProps) => {
  // Fallback to default config if gameId doesn't exist
  const config = GAME_CONFIGS[gameId] || GAME_CONFIGS.default;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center">
        {/* Special Header for specific games */}
        {gameId === "italian-pasta" && (
          <div className="mb-4 space-y-3">
            <p className="text-2xl font-bold">NEW In Food for Thought!</p>
            {subtitle && <p className="text-2xl font-semibold">{subtitle} 🤌🤌</p>}
            {headerImage && (
              <img
                src={headerImage}
                alt={headerImageAlt || "Game logo"}
                className="w-[200px] mx-auto"
              />
            )}
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="text-2xl">How to Play</DialogTitle>
          <DialogDescription asChild>
            <div className="text-base mt-2 space-y-2 text-left">
              {config.steps.map((step, index) => (
                <p key={index}>
                  {step.emoji} <strong>{step.label}:</strong> {step.text}
                </p>
              ))}
            </div>
          </DialogDescription>
        </DialogHeader>

        <Button onClick={onClose} variant="cta" className="w-full mt-4">
          Let&apos;s Go!
        </Button>
      </DialogContent>
    </Dialog>
  );
};