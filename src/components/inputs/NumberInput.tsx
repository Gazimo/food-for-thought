"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { toast } from "react-hot-toast";

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: number) => void;
  placeholder: string;
  previousGuesses?: number[];
  isComplete?: boolean;
  shake?: boolean;
  min?: number;
  max?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  previousGuesses = [],
  isComplete = false,
  shake = false,
  min = 0,
  max = 200,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const guess = parseInt(value.trim());

    if (isNaN(guess) || guess < min) {
      toast.error("Please enter a valid number!");
      return;
    }

    if (previousGuesses.includes(guess)) {
      toast.error("You already guessed that number!");
      return;
    }

    onSubmit(guess);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      min={min}
      max={max}
      className={cn("flex-1", shake && "animate-shake")}
      disabled={isComplete}
      ref={inputRef}
    />
  );
};
