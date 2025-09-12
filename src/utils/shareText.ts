export function generateShareText({
  dishGuesses,
  countryGuesses,
  proteinGuesses,
  dish,
  country,
  streak,
  acceptableGuesses = [],
  archiveDate,
}: {
  dishGuesses: string[];
  countryGuesses: { name: string; distance: number; direction: string }[];
  proteinGuesses?: { guess: number; actualProtein: number }[];
  dish: string;
  country: string;
  streak: number;
  acceptableGuesses?: string[];
  archiveDate?: string;
}) {
  const dayNumber = getGameDayNumber(archiveDate);
  const displayDate = archiveDate
    ? new Date(archiveDate).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  const lastDishGuess = dishGuesses.at(-1)?.toLowerCase();
  const lastCountryGuess = countryGuesses.at(-1)?.name.toLowerCase();

  const dishCorrect =
    lastDishGuess === dish.toLowerCase() ||
    acceptableGuesses.some(
      (acceptable) => acceptable.toLowerCase() === lastDishGuess
    );
  const countryCorrect = lastCountryGuess === country.toLowerCase();

  const dishTiles = dishGuesses
    .map((guess, i, arr) => {
      const isCorrect =
        guess.toLowerCase() === dish.toLowerCase() ||
        acceptableGuesses.some(
          (acceptable) => acceptable.toLowerCase() === guess.toLowerCase()
        );
      const isLast = i === arr.length - 1;
      if (isCorrect) return "🟩";
      if (isLast) return "🏳️";
      return "🟥";
    })
    .join("");

  const getColor = (distance: number) => {
    if (distance === 0) return "🟩";
    if (distance < 500) return "🟨";
    if (distance < 1000) return "🟧";
    if (distance < 2000) return "🟧";
    if (distance < 4000) return "🟥";
    return "⬜";
  };

  const countryTiles = countryGuesses
    .map((g, i, arr) => {
      const isLast = i === arr.length - 1;
      const isCorrect = g.name.toLowerCase() === country.toLowerCase();
      if (isLast && !isCorrect) return "🏳️";
      return getColor(g.distance);
    })
    .join("");

  const proteinLine =
    proteinGuesses && proteinGuesses.length > 0
      ? (() => {
          const actualProtein =
            proteinGuesses[proteinGuesses.length - 1]?.actualProtein;
          const arrows = proteinGuesses
            .map((pg, i, arr) => {
              const isLast = i === arr.length - 1;
              if (isLast && pg.guess === actualProtein) return "🎉";
              if (pg.guess < actualProtein) return "⬆️";
              if (pg.guess > actualProtein) return "⬇️";
              return "";
            })
            .join("");

          const lastGuess = proteinGuesses[proteinGuesses.length - 1];
          const diff = Math.abs(lastGuess.guess - actualProtein);
          const result =
            lastGuess.guess === actualProtein ? "" : `: ${diff}g off`;

          return `💪 ${arrows}${result}`;
        })()
      : "";

  const archiveLabel = archiveDate ? " [Archive]" : "";
  return `#FoodForThought ${dayNumber} (${displayDate})${archiveLabel} ${
    dishGuesses.length
  }/6
🔥 Streak: ${streak} days

🍽️ ${dishTiles}${dishCorrect ? "🎉" : ""}  ${dishGuesses.length}/6
🌍 ${countryTiles}${countryCorrect ? "🎉" : ""}  ${countryGuesses.length}${
    proteinLine ? `\n${proteinLine}` : ""
  }

https://f4t.xyz`;
}

function getGameDayNumber(archiveDate?: string): string {
  const launchDate = new Date("2025-05-10"); // TODO: change this to the actual launch date
  const targetDate = archiveDate ? new Date(archiveDate) : new Date();
  const diff = Math.floor(
    (targetDate.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return `#${diff + 1}`;
}
