import React from "react";
import { CountryGuessResult } from "../types/game";

interface CountryGuessFeedbackProps {
  guessResults: CountryGuessResult[];
}

export const CountryGuessFeedback: React.FC<CountryGuessFeedbackProps> = ({
  guessResults,
}) => {
  // Function to determine color based on distance
  const getColorForDistance = (distance: number): string => {
    if (distance === 0) return "bg-green-500";
    if (distance < 500) return "bg-green-400";
    if (distance < 1000) return "bg-yellow-400";
    if (distance < 2000) return "bg-orange-400";
    return "bg-red-500";
  };

  if (guessResults.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="font-semibold text-lg mb-2">Previous Guesses:</h3>
      <div className="space-y-2">
        {guessResults.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              result.isCorrect
                ? "border-green-500 bg-green-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{result.country}</span>
              {!result.isCorrect && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {Math.round(result.distance)} km
                  </span>
                  <span className="text-sm">{result.direction}</span>
                  <div
                    className={`w-4 h-4 rounded-full ${getColorForDistance(
                      result.distance
                    )}`}
                    title={`Distance: ${Math.round(result.distance)} km`}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
