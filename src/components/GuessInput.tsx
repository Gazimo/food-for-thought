"use client";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getClosestGuess } from "@/utils/gameHelpers";
import Image from "next/image";
import { useRef, useState } from "react";
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
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
    .filter((s) => s.toLowerCase().includes((input || "").toLowerCase()))
    .filter((s) => !previousGuesses.includes(s));

  const renderInputField = () => {
    if (suggestions.length === 0) {
      return (
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleGuess(input);
            }
          }}
          placeholder={placeholder}
          className={cn("flex-1", shake && "animate-shake")}
          disabled={isComplete}
          ref={inputRef}
        />
      );
    }

    return (
      <div className="relative flex-1">
        <Input
          value={value || input}
          onChange={(e) => {
            const newValue = e.target.value;
            setInput(newValue);
            setValue("");
            if (newValue && !open) {
              setOpen(true);
              setSelectedIndex(0);
            } else if (!newValue && open) {
              setOpen(false);
              setSelectedIndex(-1);
            } else if (newValue && open) {
              setSelectedIndex(0);
            } else {
              setSelectedIndex(-1);
            }
          }}
          onFocus={() => {
            if (input || filtered.length > 0) {
              setOpen(true);
              if (filtered.length > 0) {
                setSelectedIndex(0);
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (selectedIndex >= 0 && filtered[selectedIndex]) {
                const selectedValue = filtered[selectedIndex];
                setValue(selectedValue);
                setInput(selectedValue);
                setOpen(false);
                setSelectedIndex(-1);
                return;
              }
              if ((value || input) && !open) {
                handleGuess(value || input);
                return;
              }
              if (open) {
                return;
              }
            }
            if (e.key === "Escape") {
              setOpen(false);
              setSelectedIndex(-1);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!open && input) {
                setOpen(true);
                setSelectedIndex(0);
              } else if (open && filtered.length > 0) {
                setSelectedIndex((prev) =>
                  prev < filtered.length - 1 ? prev + 1 : prev
                );
              }
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              if (open) {
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
              }
            }
          }}
          placeholder={placeholder}
          className={cn("w-full", shake && "animate-shake")}
          disabled={isComplete}
          ref={inputRef}
        />
        <Popover
          open={open}
          onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) {
              setSelectedIndex(-1);
            }
          }}
          modal={false}
        >
          <PopoverTrigger asChild>
            <div className="absolute inset-0 pointer-events-none" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            className="p-0"
            style={{ width: "var(--radix-popover-trigger-width)" }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command shouldFilter={false}>
              <CommandList>
                <CommandEmpty>No match found.</CommandEmpty>
                <CommandGroup>
                  {filtered.map((item, index) => (
                    <CommandItem
                      key={item}
                      value={item}
                      className={cn(
                        selectedIndex === index &&
                          "bg-accent text-accent-foreground"
                      )}
                      onSelect={(selectedValue) => {
                        setValue(selectedValue);
                        setInput(selectedValue);
                        setOpen(false);
                        setSelectedIndex(-1);
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
      </div>
    );
  };

  const currentGuess = suggestions.length === 0 ? input : value || input;
  const canSubmit =
    suggestions.length === 0 ||
    (value && filtered.includes(value)) ||
    (!value && filtered.includes(input));

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
        disabled={
          !currentGuess.trim() ||
          isComplete ||
          (suggestions.length > 0 && !canSubmit)
        }
      >
        Submit
      </Button>
    </div>
  );
};
