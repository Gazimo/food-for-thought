export function generateShareText({
  dishGuesses,
  countryGuesses,
  dish,
  country,
  streak,
}: {
  dishGuesses: string[];
  countryGuesses: { name: string; distance: number; direction: string }[];
  dish: string;
  country: string;
  streak: number;
}) {
  const dayNumber = getGameDayNumber();
  const today = new Date().toLocaleDateString("en-GB");

  const dishTiles = dishGuesses
    .map((guess, i, arr) => {
      const isCorrect = guess.toLowerCase() === dish.toLowerCase();
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

  return `#FoodForThought ${dayNumber} (${today}) ${dishGuesses.length}/6
🔥 Streak: ${streak} days

🍽️ ${dishTiles}  ${dishGuesses.length}/6
🌍 ${countryTiles}  ${countryGuesses.length}

https://f4t.xyz`;
}

function getGameDayNumber(): string {
  const launchDate = new Date("2025-05-10"); // TODO: change this to the actual launch date
  const today = new Date();
  const diff = Math.floor(
    (today.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return `#${diff + 1}`;
}
