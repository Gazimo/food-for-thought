/**
 * String normalization utilities for accent-insensitive text comparison
 */

/**
 * Normalize a string for accent-insensitive comparison
 *
 * This function:
 * - Converts to lowercase
 * - Removes diacritical marks (accents) using Unicode NFD normalization
 * - Trims whitespace
 *
 * Examples:
 * - "Ragù di lepre" → "ragu di lepre"
 * - "Amatriciana" → "amatriciana"
 * - "Carbonara" → "carbonara"
 *
 * @param str - The string to normalize
 * @returns The normalized string without accents, lowercased and trimmed
 */
export function normalizeForComparison(str: string): string {
  return str
    .normalize('NFD') // Decompose accented characters (ù → u + combining mark)
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .toLowerCase()
    .trim();
}
