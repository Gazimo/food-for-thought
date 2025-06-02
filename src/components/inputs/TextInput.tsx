"use client";

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
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder: string;
  suggestions?: string[];
  previousGuesses?: string[];
  isComplete?: boolean;
  shake?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  suggestions = [],
  previousGuesses = [],
  isComplete = false,
  shake = false,
}) => {
  const [open, setOpen] = useState(false);
  const [suggestionValue, setSuggestionValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes((value || "").toLowerCase()))
    .filter((s) => !previousGuesses.includes(s));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && filtered[selectedIndex]) {
        const selectedValue = filtered[selectedIndex];
        setSuggestionValue(selectedValue);
        onChange(selectedValue);
        setOpen(false);
        setSelectedIndex(-1);
        return;
      }
      if ((suggestionValue || value) && !open) {
        onSubmit(suggestionValue || value);
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
      if (!open && value) {
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
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setSuggestionValue("");
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
  };

  const handleFocus = () => {
    if (value || filtered.length > 0) {
      setOpen(true);
      if (filtered.length > 0) {
        setSelectedIndex(0);
      }
    }
  };

  if (suggestions.length === 0) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit(value);
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
        value={suggestionValue || value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
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
                      setSuggestionValue(selectedValue);
                      onChange(selectedValue);
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
