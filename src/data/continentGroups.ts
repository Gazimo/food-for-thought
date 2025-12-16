/**
 * Countries grouped by continent/region for dish generation.
 * Enables O(1) lookup by region and sampling for AI prompts.
 *
 * Groups:
 * - Europe: European countries
 * - Asia: Asian countries (including Middle East, Caucasus)
 * - Africa: African countries
 * - Americas: North America, South America, Caribbean
 * - Oceania: Australia, New Zealand, Pacific Islands
 */

export const CONTINENT_GROUPS: Record<string, string[]> = {
  Europe: [
    "Albania",
    "Andorra",
    "Austria",
    "Belarus",
    "Belgium",
    "Bosnia and Herzegovina",
    "Bulgaria",
    "Croatia",
    "Cyprus",
    "Czechia",
    "Denmark",
    "Estonia",
    "Finland",
    "France",
    "Germany",
    "Greece",
    "Hungary",
    "Iceland",
    "Ireland",
    "Italy",
    "Kosovo",
    "Latvia",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Malta",
    "Moldova",
    "Monaco",
    "Montenegro",
    "Netherlands",
    "North Macedonia",
    "Norway",
    "Poland",
    "Portugal",
    "Romania",
    "Russia",
    "San Marino",
    "Serbia",
    "Slovakia",
    "Slovenia",
    "Spain",
    "Sweden",
    "Switzerland",
    "Ukraine",
    "United Kingdom",
    "Vatican City",
  ],

  Asia: [
    "Afghanistan",
    "Armenia",
    "Azerbaijan",
    "Bahrain",
    "Bangladesh",
    "Bhutan",
    "Brunei",
    "Cambodia",
    "China",
    "East Timor",
    "Georgia",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Israel",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Lebanon",
    "Malaysia",
    "Maldives",
    "Mongolia",
    "Myanmar",
    "Nepal",
    "North Korea",
    "Oman",
    "Pakistan",
    "Palestine",
    "Philippines",
    "Qatar",
    "Saudi Arabia",
    "Singapore",
    "South Korea",
    "Sri Lanka",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Thailand",
    "Turkey",
    "Turkmenistan",
    "United Arab Emirates",
    "Uzbekistan",
    "Vietnam",
    "Yemen",
  ],

  Africa: [
    "Algeria",
    "Angola",
    "Benin",
    "Botswana",
    "Burkina Faso",
    "Burundi",
    "Cameroon",
    "Cape Verde",
    "Central African Republic",
    "Chad",
    "Comoros",
    "Congo",
    "Democratic Republic of the Congo",
    "Djibouti",
    "Egypt",
    "Equatorial Guinea",
    "Eritrea",
    "Eswatini",
    "Ethiopia",
    "Gabon",
    "Gambia",
    "Ghana",
    "Guinea",
    "Guinea-Bissau",
    "Kenya",
    "Lesotho",
    "Liberia",
    "Libya",
    "Madagascar",
    "Malawi",
    "Mali",
    "Mauritania",
    "Mauritius",
    "Morocco",
    "Mozambique",
    "Namibia",
    "Niger",
    "Nigeria",
    "Rwanda",
    "Sao Tome and Principe",
    "Senegal",
    "Seychelles",
    "Sierra Leone",
    "Somalia",
    "South Africa",
    "South Sudan",
    "Sudan",
    "Tanzania",
    "Togo",
    "Tunisia",
    "Uganda",
    "Zambia",
    "Zimbabwe",
  ],

  Americas: [
    "Anguilla",
    "Antigua and Barbuda",
    "Argentina",
    "Aruba",
    "Bahamas",
    "Barbados",
    "Belize",
    "Bermuda",
    "Bolivia",
    "Bonaire",
    "Brazil",
    "Canada",
    "Cayman Islands",
    "Chile",
    "Colombia",
    "Costa Rica",
    "Cuba",
    "Curaçao",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "El Salvador",
    "Grenada",
    "Guatemala",
    "Guyana",
    "Haiti",
    "Honduras",
    "Jamaica",
    "Mexico",
    "Netherlands Antilles",
    "Nicaragua",
    "Panama",
    "Paraguay",
    "Peru",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Suriname",
    "Trinidad and Tobago",
    "United States of America",
    "Uruguay",
    "Venezuela",
  ],

  Oceania: [
    "American Samoa",
    "Antarctica",
    "Australia",
    "Fiji",
    "Kiribati",
    "Marshall Islands",
    "Micronesia",
    "Nauru",
    "New Zealand",
    "Palau",
    "Papua New Guinea",
    "Samoa",
    "Solomon Islands",
    "Tonga",
    "Tuvalu",
    "Vanuatu",
  ],
};

// Reverse lookup: country -> continent
export const COUNTRY_TO_CONTINENT: Record<string, string> = {};
for (const [continent, countries] of Object.entries(CONTINENT_GROUPS)) {
  for (const country of countries) {
    COUNTRY_TO_CONTINENT[country] = continent;
  }
}

// All continent names
export const CONTINENT_NAMES = Object.keys(CONTINENT_GROUPS);

/**
 * Sample N random countries from a specific continent
 */
export function sampleFromContinent(
  continent: string,
  count: number
): string[] {
  const countries = CONTINENT_GROUPS[continent];
  if (!countries) return [];
  const shuffled = [...countries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Sample N countries from each continent with custom counts per region
 * Default: 5 from Europe, Asia, Africa, Americas; 1 from Oceania = 21 total
 */
export function sampleFromAllContinents(options?: {
  Europe?: number;
  Asia?: number;
  Africa?: number;
  Americas?: number;
  Oceania?: number;
}): string[] {
  const defaults = {
    Europe: 5,
    Asia: 5,
    Africa: 5,
    Americas: 5,
    Oceania: 1,
  };
  const counts = { ...defaults, ...options };

  const sampled: string[] = [];
  for (const [continent, count] of Object.entries(counts)) {
    sampled.push(...sampleFromContinent(continent, count));
  }
  return sampled;
}

// Major continents (excluding Oceania for weighted sampling)
export const MAJOR_CONTINENTS = ["Europe", "Asia", "Africa", "Americas"];

/**
 * Sample countries with weighted distribution:
 * - Pick 1 random major continent → 5 countries
 * - Other 3 major continents → 3 countries each = 9 countries
 * - Oceania → 1 country
 * - Total: 15 countries
 */
export function sampleCountriesWeighted(): string[] {
  // Shuffle major continents and pick one to be the "featured" continent
  const shuffledMajor = [...MAJOR_CONTINENTS].sort(() => Math.random() - 0.5);
  const featuredContinent = shuffledMajor[0];
  const otherMajorContinents = shuffledMajor.slice(1);

  const sampled: string[] = [];

  // 5 countries from featured continent
  sampled.push(...sampleFromContinent(featuredContinent, 5));

  // 3 countries from each of the other 3 major continents
  for (const continent of otherMajorContinents) {
    sampled.push(...sampleFromContinent(continent, 3));
  }

  // 1 country from Oceania
  sampled.push(...sampleFromContinent("Oceania", 1));

  return sampled;
}
