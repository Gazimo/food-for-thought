"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface GiveUpButtonProps {
  onGiveUp: () => void;
}

export const GiveUpButton: React.FC<GiveUpButtonProps> = ({ onGiveUp }) => {
  const [giveUpOpen, setGiveUpOpen] = useState(false);

  const handleGiveUp = () => {
    onGiveUp();
    setGiveUpOpen(false);
  };

  return (
    <>
      <Dialog open={giveUpOpen} onOpenChange={setGiveUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to give up?</DialogTitle>
            <DialogDescription className="sr-only">
              Giving up reveals the answer for the current phase and ends your guesses for it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="default" onClick={() => setGiveUpOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleGiveUp}>
              Ok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setGiveUpOpen(true)}
        className="text-xs sm:text-sm whitespace-nowrap"
      >
        🏳️ Give up
      </Button>
    </>
  );
};
