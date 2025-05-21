"use client";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";

interface GuessInputProps {
  placeholder: string;
  onGuess: (guess: string) => void;
  suggestions?: string[];
  previousGuesses?: string[];
  isComplete?: boolean;
}

export const GuessInput: React.FC<GuessInputProps> = ({
  placeholder,
  onGuess,
  suggestions = [],
  previousGuesses = [],
  isComplete = false,
}) => {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(false);
    requestAnimationFrame(() => {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    });
  };

  const handleGuess = (guess: string) => {
    const trimmed = guess.trim().toLowerCase();

    if (!trimmed) return;

    if (previousGuesses.includes(trimmed)) {
      triggerShake();
      toast.error("You already guessed that!");
      return;
    }

    onGuess(trimmed);
    setInput("");
    setValue("");
    setOpen(false);
  };

  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(input.toLowerCase()))
    .filter((s) => !previousGuesses.includes(s));

  if (suggestions.length === 0) {
    return (
      <div className="w-full flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleGuess(input);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
            shake && "animate-shake"
          )}
          disabled={isComplete}
        />
        <Button
          variant="primary"
          disabled={!input.trim() || isComplete}
          onClick={() => handleGuess(input)}
        >
          Submit
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex justify-between gap-2">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value) {
                e.preventDefault();
                handleGuess(value);
              }
            }}
            className={cn(
              "w-full justify-between text-left truncate",
              shake && "animate-shake"
            )}
            disabled={isComplete}
          >
            {value || placeholder}
          </Button>
        </PopoverTrigger>
        <Button
          variant="primary"
          onClick={() => handleGuess(value)}
          disabled={!value.trim() || isComplete}
        >
          Submit
        </Button>
      </div>
      <PopoverContent align="start" side="bottom" className="p-0">
        <Command>
          <CommandInput
            placeholder={placeholder}
            className="h-9"
            disabled={isComplete}
          />
          <CommandList>
            <CommandEmpty>No match found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((item) => (
                <CommandItem
                  key={item}
                  value={item}
                  onSelect={(v) => {
                    setValue(v);
                    setOpen(false);
                  }}
                >
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
