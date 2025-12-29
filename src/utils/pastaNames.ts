import pastasData from "@/data/pastas.json";

/**
 * Get all pasta names from the pasta glossary
 * Used for autocomplete in pasta guessing phase
 */
export function getAllPastaNames(): string[] {
  return pastasData.map((pasta) => pasta.pasta_name);
}
