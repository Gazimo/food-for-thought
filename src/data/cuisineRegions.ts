/**
 * Cuisine-region map keyed by the `country` field on dishes.
 * Used by the dish-phase progressive hint chip.
 * Region labels are intentionally broad — the goal is to nudge the player
 * toward the right corner of the world, not narrow the answer further.
 *
 * Naming note: where the dish DB might use either a short or long form
 * (e.g. "USA" vs "United States of America", "Korea" vs "South Korea"),
 * both variants are included so coverage stays high regardless of which
 * form the AI-generated dishes use.
 */
export const CUISINE_REGIONS: Record<string, string> = {
  // Iberian / Southern Europe
  Portugal: "Iberian / Southern Europe",
  Spain: "Iberian / Southern Europe",

  // Mediterranean Europe
  Italy: "Mediterranean Europe",
  Greece: "Mediterranean Europe",
  Malta: "Mediterranean Europe",
  Cyprus: "Mediterranean Europe",

  // Western Europe
  France: "Western Europe",
  Belgium: "Western Europe",
  Netherlands: "Western Europe",
  Luxembourg: "Western Europe",
  Monaco: "Western Europe",

  // Central Europe
  Germany: "Central Europe",
  Austria: "Central Europe",
  Switzerland: "Central Europe",
  Liechtenstein: "Central Europe",
  Czechia: "Central Europe",
  "Czech Republic": "Central Europe",
  Slovakia: "Central Europe",
  Hungary: "Central Europe",
  Poland: "Central Europe",
  Slovenia: "Central Europe",

  // British Isles
  "United Kingdom": "British Isles",
  UK: "British Isles",
  England: "British Isles",
  Scotland: "British Isles",
  Wales: "British Isles",
  "Northern Ireland": "British Isles",
  Ireland: "British Isles",

  // Northern Europe / Scandinavia
  Denmark: "Northern Europe / Scandinavia",
  Sweden: "Northern Europe / Scandinavia",
  Norway: "Northern Europe / Scandinavia",
  Finland: "Northern Europe / Scandinavia",
  Iceland: "Northern Europe / Scandinavia",
  Estonia: "Northern Europe / Scandinavia",
  Latvia: "Northern Europe / Scandinavia",
  Lithuania: "Northern Europe / Scandinavia",

  // Eastern Europe
  Russia: "Eastern Europe",
  Ukraine: "Eastern Europe",
  Belarus: "Eastern Europe",
  Moldova: "Eastern Europe",
  Romania: "Eastern Europe",
  Bulgaria: "Eastern Europe",

  // Balkans (folded into Eastern Europe for the broad label)
  Serbia: "Eastern Europe",
  Croatia: "Eastern Europe",
  "Bosnia and Herzegovina": "Eastern Europe",
  Bosnia: "Eastern Europe",
  Montenegro: "Eastern Europe",
  Albania: "Eastern Europe",
  Kosovo: "Eastern Europe",
  "North Macedonia": "Eastern Europe",
  Macedonia: "Eastern Europe",

  // Anatolia / Eastern Mediterranean
  Turkey: "Anatolia / Eastern Mediterranean",

  // Caucasus
  Armenia: "Caucasus",
  Azerbaijan: "Caucasus",
  Georgia: "Caucasus",

  // Levant / Middle East
  Lebanon: "Levant / Middle East",
  Israel: "Levant / Middle East",
  Palestine: "Levant / Middle East",
  Syria: "Levant / Middle East",
  Jordan: "Levant / Middle East",
  Iraq: "Levant / Middle East",
  Iran: "Levant / Middle East",

  // Arabian Peninsula
  "Saudi Arabia": "Arabian Peninsula",
  "United Arab Emirates": "Arabian Peninsula",
  UAE: "Arabian Peninsula",
  Yemen: "Arabian Peninsula",
  Oman: "Arabian Peninsula",
  Qatar: "Arabian Peninsula",
  Bahrain: "Arabian Peninsula",
  Kuwait: "Arabian Peninsula",

  // North Africa / Maghreb
  Morocco: "North Africa / Maghreb",
  Algeria: "North Africa / Maghreb",
  Tunisia: "North Africa / Maghreb",
  Libya: "North Africa / Maghreb",
  Egypt: "North Africa / Maghreb",
  Mauritania: "North Africa / Maghreb",
  Sudan: "North Africa / Maghreb",

  // Horn of Africa
  Ethiopia: "Horn of Africa",
  Eritrea: "Horn of Africa",
  Somalia: "Horn of Africa",
  Djibouti: "Horn of Africa",
  "South Sudan": "Horn of Africa",

  // West Africa
  Nigeria: "West Africa",
  Ghana: "West Africa",
  Senegal: "West Africa",
  "Ivory Coast": "West Africa",
  "Côte d'Ivoire": "West Africa",
  Mali: "West Africa",
  "Burkina Faso": "West Africa",
  Niger: "West Africa",
  Guinea: "West Africa",
  "Sierra Leone": "West Africa",
  Liberia: "West Africa",
  Togo: "West Africa",
  Benin: "West Africa",
  Gambia: "West Africa",
  "Guinea-Bissau": "West Africa",
  "Cape Verde": "West Africa",
  Cameroon: "West Africa",

  // East Africa
  Kenya: "East Africa",
  Tanzania: "East Africa",
  Uganda: "East Africa",
  Rwanda: "East Africa",
  Burundi: "East Africa",
  Madagascar: "East Africa",
  Mauritius: "East Africa",
  Seychelles: "East Africa",
  Mozambique: "East Africa",
  Malawi: "East Africa",

  // Sub-Saharan / Southern Africa
  "South Africa": "Sub-Saharan Africa",
  Zimbabwe: "Sub-Saharan Africa",
  Zambia: "Sub-Saharan Africa",
  Botswana: "Sub-Saharan Africa",
  Namibia: "Sub-Saharan Africa",
  Lesotho: "Sub-Saharan Africa",
  Eswatini: "Sub-Saharan Africa",
  Swaziland: "Sub-Saharan Africa",
  Angola: "Sub-Saharan Africa",
  Congo: "Sub-Saharan Africa",
  "Democratic Republic of the Congo": "Sub-Saharan Africa",
  DRC: "Sub-Saharan Africa",
  Gabon: "Sub-Saharan Africa",
  "Equatorial Guinea": "Sub-Saharan Africa",
  "Central African Republic": "Sub-Saharan Africa",
  Chad: "Sub-Saharan Africa",

  // South Asia
  India: "South Asia",
  Pakistan: "South Asia",
  Bangladesh: "South Asia",
  "Sri Lanka": "South Asia",
  Nepal: "South Asia",
  Bhutan: "South Asia",
  Maldives: "South Asia",
  Afghanistan: "South Asia",

  // Central Asia
  Kazakhstan: "Central Asia",
  Uzbekistan: "Central Asia",
  Turkmenistan: "Central Asia",
  Kyrgyzstan: "Central Asia",
  Tajikistan: "Central Asia",
  Mongolia: "Central Asia",

  // Southeast Asia
  Thailand: "Southeast Asia",
  Vietnam: "Southeast Asia",
  Indonesia: "Southeast Asia",
  Malaysia: "Southeast Asia",
  Singapore: "Southeast Asia",
  Philippines: "Southeast Asia",
  Cambodia: "Southeast Asia",
  Laos: "Southeast Asia",
  Myanmar: "Southeast Asia",
  Burma: "Southeast Asia",
  Brunei: "Southeast Asia",
  "East Timor": "Southeast Asia",
  "Timor-Leste": "Southeast Asia",

  // East Asia
  Japan: "East Asia",
  China: "East Asia",
  Korea: "East Asia",
  "South Korea": "East Asia",
  "North Korea": "East Asia",
  Taiwan: "East Asia",
  "Hong Kong": "East Asia",
  Macau: "East Asia",
  Macao: "East Asia",
  Tibet: "East Asia",

  // North America
  USA: "North America",
  "United States": "North America",
  "United States of America": "North America",
  America: "North America",
  Canada: "North America",

  // Latin America
  Mexico: "Latin America",
  Guatemala: "Latin America",
  Honduras: "Latin America",
  "El Salvador": "Latin America",
  Nicaragua: "Latin America",
  "Costa Rica": "Latin America",
  Panama: "Latin America",
  Belize: "Latin America",
  Colombia: "Latin America",
  Venezuela: "Latin America",
  Ecuador: "Latin America",
  Peru: "Latin America",
  Bolivia: "Latin America",
  Brazil: "Latin America",
  Chile: "Latin America",
  Argentina: "Latin America",
  Uruguay: "Latin America",
  Paraguay: "Latin America",
  Guyana: "Latin America",
  Suriname: "Latin America",
  "French Guiana": "Latin America",

  // Caribbean
  Cuba: "Caribbean",
  Jamaica: "Caribbean",
  "Dominican Republic": "Caribbean",
  Haiti: "Caribbean",
  "Puerto Rico": "Caribbean",
  "Trinidad and Tobago": "Caribbean",
  Trinidad: "Caribbean",
  Barbados: "Caribbean",
  Bahamas: "Caribbean",
  "Antigua and Barbuda": "Caribbean",
  Dominica: "Caribbean",
  Grenada: "Caribbean",
  "Saint Lucia": "Caribbean",
  "Saint Kitts and Nevis": "Caribbean",
  "Saint Vincent and the Grenadines": "Caribbean",

  // Oceania
  Australia: "Oceania",
  "New Zealand": "Oceania",
  Fiji: "Oceania",
  "Papua New Guinea": "Oceania",
  Samoa: "Oceania",
  Tonga: "Oceania",
  Vanuatu: "Oceania",
  "Solomon Islands": "Oceania",
  Kiribati: "Oceania",
  Tuvalu: "Oceania",
  Nauru: "Oceania",
  Palau: "Oceania",
  Micronesia: "Oceania",
  "Marshall Islands": "Oceania",
};

export function getCuisineRegion(country: string): string | null {
  return CUISINE_REGIONS[country] ?? null;
}
