export function generatePastaShareText({
  pastaGuesses,
  sauceGuesses,
  regionGuesses,
  proteinGuesses,
  pasta,
  sauce,
  region,
  streak,
  pastaAcceptableGuesses = [],
  sauceAcceptableGuesses = [],
  archiveDate,
}: {
  pastaGuesses: string[];
  sauceGuesses: string[];
  regionGuesses: { region: string; distance: number; direction: string }[];
  proteinGuesses?: { guess: number; actualProtein: number }[];
  pasta: string;
  sauce: string;
  region: string;
  streak: number;
  pastaAcceptableGuesses?: string[];
  sauceAcceptableGuesses?: string[];
  archiveDate?: string;
}) {
  const dayNumber = getPastaDayNumber(archiveDate);
  const displayDate = archiveDate
    ? new Date(archiveDate).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  const lastPastaGuess = pastaGuesses.at(-1)?.toLowerCase();
  const lastSauceGuess = sauceGuesses.at(-1)?.toLowerCase();
  const lastRegionGuess = regionGuesses.at(-1)?.region?.toLowerCase();

  const pastaCorrect =
    lastPastaGuess === pasta.toLowerCase() ||
    pastaAcceptableGuesses.some(
      (acceptable) => acceptable.toLowerCase() === lastPastaGuess
    );
  const sauceCorrect =
    lastSauceGuess === sauce.toLowerCase() ||
    sauceAcceptableGuesses.some(
      (acceptable) => acceptable.toLowerCase() === lastSauceGuess
    );
  const regionCorrect = lastRegionGuess === region.toLowerCase();

  const pastaTiles = pastaGuesses
    .map((guess, i, arr) => {
      const isCorrect =
        guess.toLowerCase() === pasta.toLowerCase() ||
        pastaAcceptableGuesses.some(
          (acceptable) => acceptable.toLowerCase() === guess.toLowerCase()
        );
      const isLast = i === arr.length - 1;
      if (isCorrect) return "🟩";
      if (isLast) return "🏳️";
      return "🟥";
    })
    .join("");

  const sauceTiles = sauceGuesses
    .map((guess, i, arr) => {
      const isCorrect =
        guess.toLowerCase() === sauce.toLowerCase() ||
        sauceAcceptableGuesses.some(
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
    if (distance < 100) return "🟨";
    if (distance < 200) return "🟧";
    if (distance < 400) return "🟥";
    return "⬜";
  };

  const regionTiles = regionGuesses
    .map((g, i, arr) => {
      const isLast = i === arr.length - 1;
      const isCorrect = g.region?.toLowerCase() === region.toLowerCase();
      if (isLast && !isCorrect) return "🏳️";
      return getColor(g.distance || 0);
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
  return `#Guess'é di Pasta ${dayNumber} (${displayDate})${archiveLabel}
🔥 Streak: ${streak} days

🍝 ${pastaTiles}${pastaCorrect ? "🎉" : ""}  ${pastaGuesses.length}/6
🍅 ${sauceTiles}${sauceCorrect ? "🎉" : ""}  ${sauceGuesses.length}/6
🇮🇹 ${regionTiles}${regionCorrect ? "🎉" : ""}  ${regionGuesses.length}/6${
    proteinLine ? `\n${proteinLine}` : ""
  }

https://f4t.xyz/pasta`;
}

function getPastaDayNumber(archiveDate?: string): string {
  const launchDate = new Date("2025-12-27");
  const targetDate = archiveDate ? new Date(archiveDate) : new Date();
  const diff = Math.floor(
    (targetDate.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return `#${diff + 1}`;
}
