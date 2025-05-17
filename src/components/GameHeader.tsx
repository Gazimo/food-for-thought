import { useGameStore } from "../store/gameStore";

export function GameHeader() {
  const streak = useGameStore((s) => s.streak);

  return (
    <header className="w-full flex justify-between items-center px-4 py-2">
      <h1 className="text-xl font-bold text-orange-600">🍽️ Food for Thought</h1>
      <div
        className={`flex items-center gap-1 text-orange-500 font-semibold text-sm ${
          streak > 1 ? "animate-streak-pop" : ""
        }`}
      >
        🔥 {streak}-day streak
      </div>
    </header>
  );
}
