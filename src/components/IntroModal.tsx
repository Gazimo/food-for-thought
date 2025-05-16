"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

export const IntroModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem("hasSeenIntro");
    if (!hasSeenIntro) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenIntro", "true");
    setIsOpen(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl">How to Play</DialogTitle>
          <DialogDescription className="text-base mt-2 space-y-2">
            <p>
              🧠 Guess the <strong>dish</strong> based on revealed ingredients.
            </p>
            <p>
              🌍 Then guess the <strong>country</strong> it’s from.
            </p>
            <p>🎯 Each wrong guess reveals part of the dish image!</p>
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleClose} className="mt-4 w-full">
          Let’s Go!
        </Button>
      </DialogContent>
    </Dialog>
  );
};
