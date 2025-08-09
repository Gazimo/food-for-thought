import countries from "../../public/data/countries.json";

export function getCountryCoordsMap(): Record<
  string,
  { lat: number; lng: number }
> {
  const mapped: Record<string, { lat: number; lng: number }> = {};
  for (const [name, coords] of Object.entries(countries)) {
    const keyLower = name.toLowerCase();
    const keyNormalized = keyLower.replace(/[^a-z0-9]+/g, "");
    mapped[keyLower] = coords as any;
    mapped[keyNormalized] = coords as any; // add no-whitespace key for robust lookup
  }
  return mapped;
}

export function getCountryNames(): string[] {
  return Object.keys(countries).sort((a, b) => a.localeCompare(b));
}
