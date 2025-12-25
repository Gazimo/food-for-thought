/**
 * Sauce Types Data
 *
 * Comprehensive list of Italian pasta sauces for autocomplete functionality
 * in the Sauce guessing phase.
 *
 * This list includes traditional regional sauces and classic preparations.
 * It should be updated as new pasta entries are added to the database.
 */

/**
 * Array of sauce names for autocomplete suggestions
 * Organized by sauce category for easy maintenance
 */
export const SAUCE_TYPES: string[] = [
  // Tomato-based sauces
  "Amatriciana",
  "Arrabbiata",
  "Marinara",
  "Napoletana",
  "Norma",
  "Pomodoro",
  "Puttanesca",

  // Cream-based sauces
  "Alfredo",
  "Carbonara",
  "Cacio e pepe",
  "Quattro formaggi",

  // Meat sauces
  "Bolognese",
  "Genovese",
  "Ragu",
  "Ragu alla Bolognese",
  "Ragu Napoletano",
  "Ragu di cinghiale",

  // Pesto and herb-based
  "Pesto",
  "Pesto Genovese",
  "Pesto Rosso",
  "Pesto Trapanese",
  "Pesto alla Siciliana",

  // Seafood sauces
  "Alle vongole",
  "Allo scoglio",
  "Frutti di mare",
  "Norcina di mare",

  // Butter and oil-based
  "Aglio e olio",
  "Aglio olio e peperoncino",
  "Burro e salvia",
  "Burro fuso",

  // Regional specialties
  "All'Aglione",
  "Alla Gricia",
  "Alla Norcineria",
  "Alla Norcina",
  "Alla Vodka",
  "Cime di rapa",
  "Con le sarde",
  "In brodo",
  "In salsa",
  "Sugo all'Amatriciana",
  "Sugo di pomodoro",
  "Sugo di salsiccia",

  // Other classic preparations
  "Boscaiola",
  "Cacciatora",
  "Carbonara di zucchine",
  "Carrettiera",
  "Matriciana",
  "Nerano",
  "Pinoli e maggiorana",
  "Primavera",

  // Specialized regional sauces
  "'Nduja",
  "Aglione",
  "Aglione sauce",
  "Bottarga",
  "Colatura di alici",
  "Sugo alle noci",
  "Tartufata",
];

/**
 * Get sauce types sorted alphabetically
 */
export function getSauceTypes(): string[] {
  return [...SAUCE_TYPES].sort((a, b) => a.localeCompare(b));
}

/**
 * Get sauce types filtered by search query
 * Case-insensitive partial matching
 */
export function searchSauceTypes(query: string): string[] {
  if (!query) return SAUCE_TYPES;

  const lowerQuery = query.toLowerCase();
  return SAUCE_TYPES.filter((sauce) =>
    sauce.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Normalize sauce name for matching
 * Removes special characters, converts to lowercase
 */
export function normalizeSauceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Check if a sauce name exists in the known types
 * Uses normalized matching for flexibility
 */
export function isSauceTypeKnown(name: string): boolean {
  const normalized = normalizeSauceName(name);
  return SAUCE_TYPES.some(
    (sauce) => normalizeSauceName(sauce) === normalized
  );
}

/**
 * Common sauce aliases and alternative names
 * Maps alternative names to canonical names
 */
export const SAUCE_ALIASES: Record<string, string> = {
  "tomato sauce": "Pomodoro",
  "garlic tomato sauce": "All'Aglione",
  "garlic oil": "Aglio e olio",
  "wild boar ragu": "Ragu di cinghiale",
  "neapolitan ragu": "Ragu Napoletano",
  "naples ragu": "Ragu Napoletano",
  "bolognese sauce": "Bolognese",
  "meat sauce": "Ragu",
  "clam sauce": "Alle vongole",
  "butter sage": "Burro e salvia",
  "butter and sage": "Burro e salvia",
  "basil pesto": "Pesto Genovese",
  "trapani pesto": "Pesto Trapanese",
  "broccoli rabe": "Cime di rapa",
};

/**
 * Get canonical sauce name from an alias
 */
export function getCanonicalSauceName(name: string): string {
  const lowerName = name.toLowerCase();
  return SAUCE_ALIASES[lowerName] || name;
}
