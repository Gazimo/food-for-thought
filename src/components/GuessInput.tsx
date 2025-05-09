import { useCombobox } from "downshift";
import React, { useState } from "react";

interface GuessInputProps {
  placeholder: string;
  onGuess: (guess: string) => void;
  suggestions?: string[];
}

export const GuessInput: React.FC<GuessInputProps> = ({
  placeholder,
  onGuess,
  suggestions = [],
}) => {
  const [input, setInput] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  if (suggestions.length === 0) {
    return (
      <div className="w-full">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                onGuess(input.trim());
                setInput("");
              }
            }}
            placeholder={placeholder}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  }

  const filteredSuggestions = suggestions.filter(
    (item) => !input || item.toLowerCase().includes(input.toLowerCase())
  );

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    reset,
    setInputValue,
  } = useCombobox({
    items: filteredSuggestions,
    inputValue: input,
    selectedItem,
    onInputValueChange: ({ inputValue }) => {
      setInput(inputValue ?? "");
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        onGuess(selectedItem);
        setInput("");
        setInputValue("");
        setSelectedItem(null);
        reset();
      }
    },
    onStateChange({ inputValue, type }) {
      if (
        type === useCombobox.stateChangeTypes.InputKeyDownEnter &&
        inputValue &&
        !filteredSuggestions.includes(inputValue)
      ) {
        onGuess(inputValue);
        setInput("");
        setInputValue("");
        setSelectedItem(null);
        reset();
      }
    },
  });

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <input
          {...getInputProps({
            placeholder,
            className:
              "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
          })}
        />
      </div>
      <ul
        {...getMenuProps()}
        className="mt-1 border border-gray-200 rounded-md shadow-md bg-white max-h-48 overflow-auto"
      >
        {isOpen &&
          filteredSuggestions.map((item, index) => (
            <li
              key={`${item}${index}`}
              {...getItemProps({ item, index })}
              className={`px-4 py-2 cursor-pointer ${
                highlightedIndex === index ? "bg-blue-100" : ""
              }`}
            >
              {item}
            </li>
          ))}
      </ul>
    </div>
  );
};
