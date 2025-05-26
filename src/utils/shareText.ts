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
  const today = new Date().toLocaleDateString("en-GB"); // 26.05.2025

  const dishTiles = dishGuesses
    .map((g) => (g.toLowerCase() === dish.toLowerCase() ? "🟩" : "🟥"))
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
    .map((g) => {
      if (g.name.toLowerCase() === country.toLowerCase()) return "🎯";
      return getColor(g.distance);
    })
    .join("");

  return `#FoodForThought ${dayNumber} (${today}) ${dishGuesses.length}/6
🔥 Streak: ${streak} days

🍽️ ${dishTiles}  ${dishGuesses.length}/6
🌍 ${countryTiles}  ${countryGuesses.length}

https://foodforthought.game`;
}

function getGameDayNumber(): string {
  const launchDate = new Date("2025-05-10");
  const today = new Date();
  const diff = Math.floor(
    (today.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return `#${diff + 1}`;
}
