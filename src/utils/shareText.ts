export function generateShareText({
  dishGuesses,
  countryGuesses,
  dish,
  country,
  streak,
}: {
  dishGuesses: string[];
  countryGuesses: string[];
  dish: string;
  country: string;
  streak: number;
}) {
  const dishResult = dishGuesses
    .map((g) => (g === dish.toLowerCase() ? "✅" : "❌"))
    .join(" ");

  const countryResult = countryGuesses
    .map((g) => (g === country.toLowerCase() ? "🌍" : "❌"))
    .join(" ");

  return `Food for Thought 🧠🍽️
Dish: ${dishResult}
Country: ${countryResult}
🔥 ${streak}-day streak
Play: foodforthought.game`;
}
