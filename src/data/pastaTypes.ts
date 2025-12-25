/**
 * Pasta Types Data
 *
 * Comprehensive list of Italian pasta types for autocomplete functionality
 * in the Pasta guessing phase.
 *
 * This list includes both common and regional specialty pasta shapes.
 * It should be updated as new pasta entries are added to the database.
 */

/**
 * Array of pasta type names for autocomplete suggestions
 * Organized alphabetically for easy maintenance
 */
export const PASTA_TYPES: string[] = [
  // Long pasta
  "Bavette",
  "Bigoli",
  "Bucatini",
  "Capellini",
  "Fettuccine",
  "Linguine",
  "Maccheroni alla chitarra",
  "Pappardelle",
  "Pici",
  "Spaghetti",
  "Spaghettini",
  "Tagliatelle",
  "Tagliolini",
  "Trenette",
  "Vermicelli",

  // Short pasta
  "Cavatappi",
  "Conchiglie",
  "Farfalle",
  "Fusilli",
  "Gemelli",
  "Maccheroni",
  "Mezze maniche",
  "Paccheri",
  "Penne",
  "Penne rigate",
  "Rigatoni",
  "Tortiglioni",
  "Ziti",

  // Shaped pasta
  "Busiate",
  "Cavatelli",
  "Casarecce",
  "Corzetti",
  "Creste di gallo",
  "Garganelli",
  "Malloreddus",
  "Orecchiette",
  "Radiatori",
  "Rotelle",
  "Strozzapreti",
  "Trofie",

  // Filled pasta
  "Agnolotti",
  "Cappelletti",
  "Culurgiones",
  "Ravioli",
  "Tortellini",
  "Tortelloni",

  // Regional specialties
  "Caccavelle",
  "Candele",
  "Fregola",
  "Lagane",
  "Lorighittas",
  "Maccheroni al ferretto",
  "Pansotti",
  "Passatelli",
  "Pizzoccheri",
  "Scialatelli",
  "Strangozzi",
  "Stracci",
  "Tacconi",
  "Testaroli",
  "Tria",
  "Umbricelli",

  // Less common shapes
  "Cascatelli",
  "Caramelle",
  "Campanelle",
  "Gnocchi",
  "Lumache",
  "Lumaconi",
  "Quadrefiore",
  "Reginette",
  "Stelle",
  "Stringozzi",
];

/**
 * Get pasta types sorted alphabetically (already sorted above)
 */
export function getPastaTypes(): string[] {
  return [...PASTA_TYPES];
}

/**
 * Get pasta types filtered by search query
 * Case-insensitive partial matching
 */
export function searchPastaTypes(query: string): string[] {
  if (!query) return PASTA_TYPES;

  const lowerQuery = query.toLowerCase();
  return PASTA_TYPES.filter((pasta) =>
    pasta.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Normalize pasta name for matching
 * Removes special characters, converts to lowercase
 */
export function normalizePastaName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Check if a pasta name exists in the known types
 * Uses normalized matching for flexibility
 */
export function isPastaTypeKnown(name: string): boolean {
  const normalized = normalizePastaName(name);
  return PASTA_TYPES.some(
    (pasta) => normalizePastaName(pasta) === normalized
  );
}
