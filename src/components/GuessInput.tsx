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

interface GuessInputProps {
  placeholder: string;
  onGuess: (guess: string) => void;
  suggestions?: string[];
  previousGuesses?: string[];
}

export const GuessInput: React.FC<GuessInputProps> = ({
  placeholder,
  onGuess,
  suggestions = [],
  previousGuesses = [],
}) => {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleGuess = (guess: string) => {
    const trimmed = guess.trim();
    if (!trimmed || previousGuesses.includes(trimmed)) return;

    onGuess(trimmed);
    setInput("");
    setValue("");
    setOpen(false);
  };

  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(input.toLowerCase()))
    .filter((s) => !previousGuesses.includes(s));

  // ✅ Case: fallback to plain input + button
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
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          variant="fun"
          disabled={!input.trim()}
          onClick={() => handleGuess(input)}
        >
          Submit
        </Button>
      </div>
    );
  }

  // ✅ Case: suggestions exist — use full combobox
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex justify-between gap-2">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left truncate"
          >
            {value || placeholder}
          </Button>
        </PopoverTrigger>
        <Button
          variant="fun"
          className="block sm:hidden"
          onClick={() => handleGuess(value)}
          disabled={!value.trim()}
        >
          Submit
        </Button>
      </div>
      <PopoverContent align="start" side="bottom" className="p-0">
        <Command>
          <CommandInput placeholder={placeholder} className="h-9" />
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
                    onGuess(v);
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
