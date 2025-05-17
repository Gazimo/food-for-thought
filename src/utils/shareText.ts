export function getShareText(
  dishGuesses: string[],
  countryGuesses: string[],
  dish: string,
  country: string,
  streak: number
) {
  const dishResult = dishGuesses
    .map((g) => (g === dish ? "✅" : "❌"))
    .join(" ");
  const countryResult = countryGuesses
    .map((g) => (g === country ? "🌍" : "❌"))
    .join(" ");

  return `Food for Thought 🧠🍽️\nDish: ${dishResult}\nCountry: ${countryResult}\n🔥 ${streak}-day streak\nTry it: foodforthought.game`;
}
