import countries from "../../public/data/countries.json";

export function getCountryCoordsMap(): Record<
  string,
  { lat: number; lng: number }
> {
  const mapped: Record<string, { lat: number; lng: number }> = {};
  for (const [name, coords] of Object.entries(countries)) {
    mapped[name.toLowerCase()] = coords;
  }
  return mapped;
}

export function getCountryNames(): string[] {
  return Object.keys(countries).sort((a, b) => a.localeCompare(b));
}
