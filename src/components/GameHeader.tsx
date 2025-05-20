import Link from "next/link";

export function GameHeader() {
  return (
    <header className="w-full flex justify-between items-center px-4 py-2">
      <Link href="/">
        <h1 className="text-xl font-bold text-orange-600">
          🍽️ Food for Thought
        </h1>
      </Link>
    </header>
  );
}
