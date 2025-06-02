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
import { getClosestGuess } from "@/utils/gameHelpers"; // adjust path as needed
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";
import { useGameStore } from "../store/gameStore";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface GuessInputProps {
  placeholder: string;
  onGuess: (guess: string) => void;
  suggestions?: string[];
  previousGuesses?: string[];
  isComplete?: boolean;
  acceptableGuesses?: string[];
}

export const GuessInput: React.FC<GuessInputProps> = ({
  placeholder,
  onGuess,
  suggestions = [],
  previousGuesses = [],
  isComplete = false,
  acceptableGuesses = [],
}) => {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [giveUpOpen, setGiveUpOpen] = useState(false);
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const { revealAllTiles, completeGame, moveToCountryPhase, activePhase } =
    useGameStore();

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

    const isCorrect = acceptableGuesses
      .map((s) => s.toLowerCase())
      .includes(trimmed);

    if (!isCorrect) {
      const suggestion = getClosestGuess(trimmed, acceptableGuesses);
      if (suggestion) {
        toast((t) => (
          <span>
            Did you mean{" "}
            <button
              className="text-blue-600 underline"
              onClick={() => {
                toast.dismiss(t.id);
                handleGuess(suggestion);
              }}
            >
              {suggestion}
            </button>
            ?
          </span>
        ));
        return;
      }
    }

    onGuess(trimmed);
    setInput("");
    setValue("");
    setOpen(false);
  };

  const handleGiveUp = () => {
    revealAllTiles();
    if (activePhase === "dish") {
      moveToCountryPhase();
    } else {
      completeGame();
    }
  };

  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(input.toLowerCase()))
    .filter((s) => !previousGuesses.includes(s));

  const renderInputField = () => {
    if (suggestions.length === 0) {
      return (
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
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
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
        <PopoverContent align="start" side="bottom" className="p-0">
          <Command>
            <CommandInput
              placeholder={placeholder}
              className="h-9"
              disabled={isComplete}
              onValueChange={setInput}
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

  const currentGuess = suggestions.length === 0 ? input : value;

  return (
    <div className="w-full flex gap-2 items-center">
      <Dialog open={giveUpOpen} onOpenChange={setGiveUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to give up?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="default" onClick={() => setGiveUpOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleGiveUp();
                setGiveUpOpen(false);
              }}
            >
              Ok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        className="p-1 sm:p-1.5 md:p-2"
        variant="danger"
        onClick={() => setGiveUpOpen(true)}
      >
        <div className="w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 relative">
          <Image
            src="/images/give-up.png"
            alt="Give Up"
            fill
            className="object-contain"
          />
        </div>
      </Button>

      {renderInputField()}
      <Button
        variant="primary"
        onClick={() => handleGuess(currentGuess)}
        disabled={!currentGuess.trim() || isComplete}
      >
        Submit
      </Button>
    </div>
  );
};
