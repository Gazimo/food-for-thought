"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PastaIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PastaIntroModal = ({ isOpen, onClose }: PastaIntroModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl">How to Play</DialogTitle>
          <DialogDescription className="text-base mt-2 space-y-2">
            <p>
              🍝 <strong>Guess the pasta:</strong> You&apos;ll see a blurred image of a
              pasta shape. With each incorrect guess, the image will become clearer
              and you&apos;ll get more hints. You have 6 tries.
            </p>
            <p>
              🍅 <strong>Guess the sauce:</strong> Once you&apos;ve guessed the
              pasta, guess its traditional sauce. You have 6 tries.
            </p>
            <p>
              🇮🇹 <strong>Guess the region:</strong> Guess the Italian region
              where this pasta originates. You have 6 tries and distance hints.
            </p>
            <p>
              💪 <strong>Guess the protein:</strong> You have 4 tries to guess the
              protein per serving in grams.
            </p>
          </DialogDescription>
        </DialogHeader>
        <Button onClick={onClose} variant="cta">
          Let&apos;s Go!
        </Button>
      </DialogContent>
    </Dialog>
  );
};
