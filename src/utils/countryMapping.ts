// Comprehensive country mapping for flag-icons library
// This utility handles both country names and ISO codes

export interface CountryInfo {
  name: string;
  isoCode: string;
  flagCode: string;
}

// Comprehensive country mapping
const COUNTRY_MAP: { [key: string]: CountryInfo } = {
  // Major European countries
  "United Kingdom": { name: "United Kingdom", isoCode: "GB", flagCode: "gb" },
  "Great Britain": { name: "United Kingdom", isoCode: "GB", flagCode: "gb" },
  England: { name: "England", isoCode: "GB-ENG", flagCode: "gb-eng" },
  Scotland: { name: "Scotland", isoCode: "GB-SCT", flagCode: "gb-sct" },
  Wales: { name: "Wales", isoCode: "GB-WLS", flagCode: "gb-wls" },
  "Northern Ireland": {
    name: "Northern Ireland",
    isoCode: "GB-NIR",
    flagCode: "gb-nir",
  },

  // Western Europe
  Germany: { name: "Germany", isoCode: "DE", flagCode: "de" },
  France: { name: "France", isoCode: "FR", flagCode: "fr" },
  Italy: { name: "Italy", isoCode: "IT", flagCode: "it" },
  Spain: { name: "Spain", isoCode: "ES", flagCode: "es" },
  Netherlands: { name: "Netherlands", isoCode: "NL", flagCode: "nl" },
  Belgium: { name: "Belgium", isoCode: "BE", flagCode: "be" },
  Austria: { name: "Austria", isoCode: "AT", flagCode: "at" },
  Switzerland: { name: "Switzerland", isoCode: "CH", flagCode: "ch" },
  Portugal: { name: "Portugal", isoCode: "PT", flagCode: "pt" },
  Ireland: { name: "Ireland", isoCode: "IE", flagCode: "ie" },
  Luxembourg: { name: "Luxembourg", isoCode: "LU", flagCode: "lu" },
  Monaco: { name: "Monaco", isoCode: "MC", flagCode: "mc" },
  Liechtenstein: { name: "Liechtenstein", isoCode: "LI", flagCode: "li" },
  Andorra: { name: "Andorra", isoCode: "AD", flagCode: "ad" },
  "San Marino": { name: "San Marino", isoCode: "SM", flagCode: "sm" },
  "Vatican City": { name: "Vatican City", isoCode: "VA", flagCode: "va" },
  Malta: { name: "Malta", isoCode: "MT", flagCode: "mt" },
  Cyprus: { name: "Cyprus", isoCode: "CY", flagCode: "cy" },

  // Northern Europe
  Sweden: { name: "Sweden", isoCode: "SE", flagCode: "se" },
  Norway: { name: "Norway", isoCode: "NO", flagCode: "no" },
  Denmark: { name: "Denmark", isoCode: "DK", flagCode: "dk" },
  Finland: { name: "Finland", isoCode: "FI", flagCode: "fi" },
  Iceland: { name: "Iceland", isoCode: "IS", flagCode: "is" },
  "Faroe Islands": { name: "Faroe Islands", isoCode: "FO", flagCode: "fo" },
  Greenland: { name: "Greenland", isoCode: "GL", flagCode: "gl" },

  // Eastern Europe
  Poland: { name: "Poland", isoCode: "PL", flagCode: "pl" },
  "Czech Republic": { name: "Czech Republic", isoCode: "CZ", flagCode: "cz" },
  Slovakia: { name: "Slovakia", isoCode: "SK", flagCode: "sk" },
  Hungary: { name: "Hungary", isoCode: "HU", flagCode: "hu" },
  Romania: { name: "Romania", isoCode: "RO", flagCode: "ro" },
  Bulgaria: { name: "Bulgaria", isoCode: "BG", flagCode: "bg" },
  Greece: { name: "Greece", isoCode: "GR", flagCode: "gr" },
  Croatia: { name: "Croatia", isoCode: "HR", flagCode: "hr" },
  Slovenia: { name: "Slovenia", isoCode: "SI", flagCode: "si" },
  Serbia: { name: "Serbia", isoCode: "RS", flagCode: "rs" },
  "Bosnia and Herzegovina": {
    name: "Bosnia and Herzegovina",
    isoCode: "BA",
    flagCode: "ba",
  },
  "Bosnia-Herzegovina": {
    name: "Bosnia and Herzegovina",
    isoCode: "BA",
    flagCode: "ba",
  },
  Montenegro: { name: "Montenegro", isoCode: "ME", flagCode: "me" },
  "North Macedonia": { name: "North Macedonia", isoCode: "MK", flagCode: "mk" },
  Albania: { name: "Albania", isoCode: "AL", flagCode: "al" },
  Kosovo: { name: "Kosovo", isoCode: "XK", flagCode: "xk" },
  Moldova: { name: "Moldova", isoCode: "MD", flagCode: "md" },
  Ukraine: { name: "Ukraine", isoCode: "UA", flagCode: "ua" },
  Belarus: { name: "Belarus", isoCode: "BY", flagCode: "by" },
  Lithuania: { name: "Lithuania", isoCode: "LT", flagCode: "lt" },
  Latvia: { name: "Latvia", isoCode: "LV", flagCode: "lv" },
  Estonia: { name: "Estonia", isoCode: "EE", flagCode: "ee" },
  Russia: { name: "Russia", isoCode: "RU", flagCode: "ru" },

  // North America
  "United States": { name: "United States", isoCode: "US", flagCode: "us" },
  Canada: { name: "Canada", isoCode: "CA", flagCode: "ca" },
  Mexico: { name: "Mexico", isoCode: "MX", flagCode: "mx" },

  // South America
  Brazil: { name: "Brazil", isoCode: "BR", flagCode: "br" },
  Argentina: { name: "Argentina", isoCode: "AR", flagCode: "ar" },
  Chile: { name: "Chile", isoCode: "CL", flagCode: "cl" },
  Colombia: { name: "Colombia", isoCode: "CO", flagCode: "co" },
  Peru: { name: "Peru", isoCode: "PE", flagCode: "pe" },
  Venezuela: { name: "Venezuela", isoCode: "VE", flagCode: "ve" },
  Ecuador: { name: "Ecuador", isoCode: "EC", flagCode: "ec" },
  Bolivia: { name: "Bolivia", isoCode: "BO", flagCode: "bo" },
  Paraguay: { name: "Paraguay", isoCode: "PY", flagCode: "py" },
  Uruguay: { name: "Uruguay", isoCode: "UY", flagCode: "uy" },
  Guyana: { name: "Guyana", isoCode: "GY", flagCode: "gy" },
  Suriname: { name: "Suriname", isoCode: "SR", flagCode: "sr" },
  "French Guiana": { name: "French Guiana", isoCode: "GF", flagCode: "gf" },

  // Asia
  China: { name: "China", isoCode: "CN", flagCode: "cn" },
  Japan: { name: "Japan", isoCode: "JP", flagCode: "jp" },
  "South Korea": { name: "South Korea", isoCode: "KR", flagCode: "kr" },
  "North Korea": { name: "North Korea", isoCode: "KP", flagCode: "kp" },
  India: { name: "India", isoCode: "IN", flagCode: "in" },
  Pakistan: { name: "Pakistan", isoCode: "PK", flagCode: "pk" },
  Bangladesh: { name: "Bangladesh", isoCode: "BD", flagCode: "bd" },
  "Sri Lanka": { name: "Sri Lanka", isoCode: "LK", flagCode: "lk" },
  Nepal: { name: "Nepal", isoCode: "NP", flagCode: "np" },
  Bhutan: { name: "Bhutan", isoCode: "BT", flagCode: "bt" },
  Maldives: { name: "Maldives", isoCode: "MV", flagCode: "mv" },
  Afghanistan: { name: "Afghanistan", isoCode: "AF", flagCode: "af" },
  Iran: { name: "Iran", isoCode: "IR", flagCode: "ir" },
  Iraq: { name: "Iraq", isoCode: "IQ", flagCode: "iq" },
  Syria: { name: "Syria", isoCode: "SY", flagCode: "sy" },
  Lebanon: { name: "Lebanon", isoCode: "LB", flagCode: "lb" },
  Jordan: { name: "Jordan", isoCode: "JO", flagCode: "jo" },
  Israel: { name: "Israel", isoCode: "IL", flagCode: "il" },
  Palestine: { name: "Palestine", isoCode: "PS", flagCode: "ps" },
  "Saudi Arabia": { name: "Saudi Arabia", isoCode: "SA", flagCode: "sa" },
  Yemen: { name: "Yemen", isoCode: "YE", flagCode: "ye" },
  Oman: { name: "Oman", isoCode: "OM", flagCode: "om" },
  "United Arab Emirates": {
    name: "United Arab Emirates",
    isoCode: "AE",
    flagCode: "ae",
  },
  Qatar: { name: "Qatar", isoCode: "QA", flagCode: "qa" },
  Kuwait: { name: "Kuwait", isoCode: "KW", flagCode: "kw" },
  Bahrain: { name: "Bahrain", isoCode: "BH", flagCode: "bh" },
  Turkey: { name: "Turkey", isoCode: "TR", flagCode: "tr" },
  Georgia: { name: "Georgia", isoCode: "GE", flagCode: "ge" },
  Armenia: { name: "Armenia", isoCode: "AM", flagCode: "am" },
  Azerbaijan: { name: "Azerbaijan", isoCode: "AZ", flagCode: "az" },
  Kazakhstan: { name: "Kazakhstan", isoCode: "KZ", flagCode: "kz" },
  Uzbekistan: { name: "Uzbekistan", isoCode: "UZ", flagCode: "uz" },
  Turkmenistan: { name: "Turkmenistan", isoCode: "TM", flagCode: "tm" },
  Kyrgyzstan: { name: "Kyrgyzstan", isoCode: "KG", flagCode: "kg" },
  Tajikistan: { name: "Tajikistan", isoCode: "TJ", flagCode: "tj" },
  Mongolia: { name: "Mongolia", isoCode: "MN", flagCode: "mn" },
  Myanmar: { name: "Myanmar", isoCode: "MM", flagCode: "mm" },
  Thailand: { name: "Thailand", isoCode: "TH", flagCode: "th" },
  Vietnam: { name: "Vietnam", isoCode: "VN", flagCode: "vn" },
  Cambodia: { name: "Cambodia", isoCode: "KH", flagCode: "kh" },
  Laos: { name: "Laos", isoCode: "LA", flagCode: "la" },
  Malaysia: { name: "Malaysia", isoCode: "MY", flagCode: "my" },
  Singapore: { name: "Singapore", isoCode: "SG", flagCode: "sg" },
  Indonesia: { name: "Indonesia", isoCode: "ID", flagCode: "id" },
  Philippines: { name: "Philippines", isoCode: "PH", flagCode: "ph" },
  Taiwan: { name: "Taiwan", isoCode: "TW", flagCode: "tw" },
  "Hong Kong": { name: "Hong Kong", isoCode: "HK", flagCode: "hk" },
  Macau: { name: "Macau", isoCode: "MO", flagCode: "mo" },
  Brunei: { name: "Brunei", isoCode: "BN", flagCode: "bn" },
  "East Timor": { name: "East Timor", isoCode: "TL", flagCode: "tl" },

  // Africa
  "South Africa": { name: "South Africa", isoCode: "ZA", flagCode: "za" },
  Egypt: { name: "Egypt", isoCode: "EG", flagCode: "eg" },
  Morocco: { name: "Morocco", isoCode: "MA", flagCode: "ma" },
  Algeria: { name: "Algeria", isoCode: "DZ", flagCode: "dz" },
  Tunisia: { name: "Tunisia", isoCode: "TN", flagCode: "tn" },
  Libya: { name: "Libya", isoCode: "LY", flagCode: "ly" },
  Sudan: { name: "Sudan", isoCode: "SD", flagCode: "sd" },
  "South Sudan": { name: "South Sudan", isoCode: "SS", flagCode: "ss" },
  Ethiopia: { name: "Ethiopia", isoCode: "ET", flagCode: "et" },
  Eritrea: { name: "Eritrea", isoCode: "ER", flagCode: "er" },
  Djibouti: { name: "Djibouti", isoCode: "DJ", flagCode: "dj" },
  Somalia: { name: "Somalia", isoCode: "SO", flagCode: "so" },
  Kenya: { name: "Kenya", isoCode: "KE", flagCode: "ke" },
  Uganda: { name: "Uganda", isoCode: "UG", flagCode: "ug" },
  Tanzania: { name: "Tanzania", isoCode: "TZ", flagCode: "tz" },
  Rwanda: { name: "Rwanda", isoCode: "RW", flagCode: "rw" },
  Burundi: { name: "Burundi", isoCode: "BI", flagCode: "bi" },
  Nigeria: { name: "Nigeria", isoCode: "NG", flagCode: "ng" },
  Ghana: { name: "Ghana", isoCode: "GH", flagCode: "gh" },
  "Ivory Coast": { name: "Ivory Coast", isoCode: "CI", flagCode: "ci" },
  Senegal: { name: "Senegal", isoCode: "SN", flagCode: "sn" },
  Mali: { name: "Mali", isoCode: "ML", flagCode: "ml" },
  "Burkina Faso": { name: "Burkina Faso", isoCode: "BF", flagCode: "bf" },
  Niger: { name: "Niger", isoCode: "NE", flagCode: "ne" },
  Chad: { name: "Chad", isoCode: "TD", flagCode: "td" },
  Cameroon: { name: "Cameroon", isoCode: "CM", flagCode: "cm" },
  "Central African Republic": {
    name: "Central African Republic",
    isoCode: "CF",
    flagCode: "cf",
  },
  Gabon: { name: "Gabon", isoCode: "GA", flagCode: "ga" },
  Congo: { name: "Congo", isoCode: "CG", flagCode: "cg" },
  "Democratic Republic of the Congo": {
    name: "Democratic Republic of the Congo",
    isoCode: "CD",
    flagCode: "cd",
  },
  Angola: { name: "Angola", isoCode: "AO", flagCode: "ao" },
  Zambia: { name: "Zambia", isoCode: "ZM", flagCode: "zm" },
  Zimbabwe: { name: "Zimbabwe", isoCode: "ZW", flagCode: "zw" },
  Botswana: { name: "Botswana", isoCode: "BW", flagCode: "bw" },
  Namibia: { name: "Namibia", isoCode: "NA", flagCode: "na" },
  Lesotho: { name: "Lesotho", isoCode: "LS", flagCode: "ls" },
  Eswatini: { name: "Eswatini", isoCode: "SZ", flagCode: "sz" },
  Madagascar: { name: "Madagascar", isoCode: "MG", flagCode: "mg" },
  Mauritius: { name: "Mauritius", isoCode: "MU", flagCode: "mu" },
  Seychelles: { name: "Seychelles", isoCode: "SC", flagCode: "sc" },
  Comoros: { name: "Comoros", isoCode: "KM", flagCode: "km" },
  Mauritania: { name: "Mauritania", isoCode: "MR", flagCode: "mr" },
  Gambia: { name: "Gambia", isoCode: "GM", flagCode: "gm" },
  "Guinea-Bissau": { name: "Guinea-Bissau", isoCode: "GW", flagCode: "gw" },
  Guinea: { name: "Guinea", isoCode: "GN", flagCode: "gn" },
  "Sierra Leone": { name: "Sierra Leone", isoCode: "SL", flagCode: "sl" },
  Liberia: { name: "Liberia", isoCode: "LR", flagCode: "lr" },
  Togo: { name: "Togo", isoCode: "TG", flagCode: "tg" },
  Benin: { name: "Benin", isoCode: "BJ", flagCode: "bj" },
  "Cape Verde": { name: "Cape Verde", isoCode: "CV", flagCode: "cv" },
  "São Tomé and Príncipe": {
    name: "São Tomé and Príncipe",
    isoCode: "ST",
    flagCode: "st",
  },
  "Equatorial Guinea": {
    name: "Equatorial Guinea",
    isoCode: "GQ",
    flagCode: "gq",
  },

  // Oceania
  Australia: { name: "Australia", isoCode: "AU", flagCode: "au" },
  "New Zealand": { name: "New Zealand", isoCode: "NZ", flagCode: "nz" },
  "Papua New Guinea": {
    name: "Papua New Guinea",
    isoCode: "PG",
    flagCode: "pg",
  },
  Fiji: { name: "Fiji", isoCode: "FJ", flagCode: "fj" },
  "Solomon Islands": { name: "Solomon Islands", isoCode: "SB", flagCode: "sb" },
  Vanuatu: { name: "Vanuatu", isoCode: "VU", flagCode: "vu" },
  "New Caledonia": { name: "New Caledonia", isoCode: "NC", flagCode: "nc" },
  "French Polynesia": {
    name: "French Polynesia",
    isoCode: "PF",
    flagCode: "pf",
  },
  Samoa: { name: "Samoa", isoCode: "WS", flagCode: "ws" },
  "American Samoa": { name: "American Samoa", isoCode: "AS", flagCode: "as" },
  Tonga: { name: "Tonga", isoCode: "TO", flagCode: "to" },
  Tuvalu: { name: "Tuvalu", isoCode: "TV", flagCode: "tv" },
  Kiribati: { name: "Kiribati", isoCode: "KI", flagCode: "ki" },
  Nauru: { name: "Nauru", isoCode: "NR", flagCode: "nr" },
  Palau: { name: "Palau", isoCode: "PW", flagCode: "pw" },
  "Marshall Islands": {
    name: "Marshall Islands",
    isoCode: "MH",
    flagCode: "mh",
  },
  Micronesia: { name: "Micronesia", isoCode: "FM", flagCode: "fm" },
  "Northern Mariana Islands": {
    name: "Northern Mariana Islands",
    isoCode: "MP",
    flagCode: "mp",
  },
  Guam: { name: "Guam", isoCode: "GU", flagCode: "gu" },

  // Caribbean
  Cuba: { name: "Cuba", isoCode: "CU", flagCode: "cu" },
  Jamaica: { name: "Jamaica", isoCode: "JM", flagCode: "jm" },
  Haiti: { name: "Haiti", isoCode: "HT", flagCode: "ht" },
  "Dominican Republic": {
    name: "Dominican Republic",
    isoCode: "DO",
    flagCode: "do",
  },
  "Puerto Rico": { name: "Puerto Rico", isoCode: "PR", flagCode: "pr" },
  Bahamas: { name: "Bahamas", isoCode: "BS", flagCode: "bs" },
  Barbados: { name: "Barbados", isoCode: "BB", flagCode: "bb" },
  "Trinidad and Tobago": {
    name: "Trinidad and Tobago",
    isoCode: "TT",
    flagCode: "tt",
  },
  Grenada: { name: "Grenada", isoCode: "GD", flagCode: "gd" },
  "Saint Vincent and the Grenadines": {
    name: "Saint Vincent and the Grenadines",
    isoCode: "VC",
    flagCode: "vc",
  },
  "Saint Lucia": { name: "Saint Lucia", isoCode: "LC", flagCode: "lc" },
  Dominica: { name: "Dominica", isoCode: "DM", flagCode: "dm" },
  "Antigua and Barbuda": {
    name: "Antigua and Barbuda",
    isoCode: "AG",
    flagCode: "ag",
  },
  "Saint Kitts and Nevis": {
    name: "Saint Kitts and Nevis",
    isoCode: "KN",
    flagCode: "kn",
  },

  // Central America
  Guatemala: { name: "Guatemala", isoCode: "GT", flagCode: "gt" },
  Belize: { name: "Belize", isoCode: "BZ", flagCode: "bz" },
  "El Salvador": { name: "El Salvador", isoCode: "SV", flagCode: "sv" },
  Honduras: { name: "Honduras", isoCode: "HN", flagCode: "hn" },
  Nicaragua: { name: "Nicaragua", isoCode: "NI", flagCode: "ni" },
  "Costa Rica": { name: "Costa Rica", isoCode: "CR", flagCode: "cr" },
  Panama: { name: "Panama", isoCode: "PA", flagCode: "pa" },
};

// Create reverse mappings for ISO codes and common variations
const ISO_TO_FLAG: { [key: string]: string } = {};
const COMMON_VARIATIONS: { [key: string]: string } = {};

Object.entries(COUNTRY_MAP).forEach(([name, info]) => {
  ISO_TO_FLAG[info.isoCode] = info.flagCode;
  ISO_TO_FLAG[info.isoCode.toLowerCase()] = info.flagCode;

  // Add common variations
  COMMON_VARIATIONS[name.toLowerCase()] = info.flagCode;
  COMMON_VARIATIONS[info.isoCode.toLowerCase()] = info.flagCode;

  // Add without spaces
  COMMON_VARIATIONS[name.toLowerCase().replace(/\s+/g, "")] = info.flagCode;

  // Add common abbreviations
  if (name === "United States") {
    COMMON_VARIATIONS["usa"] = info.flagCode;
    COMMON_VARIATIONS["us"] = info.flagCode;
  }
  if (name === "United Kingdom") {
    COMMON_VARIATIONS["uk"] = info.flagCode;
    COMMON_VARIATIONS["britain"] = info.flagCode;
  }
  if (name === "Czech Republic") {
    COMMON_VARIATIONS["czech"] = info.flagCode;
    COMMON_VARIATIONS["czechia"] = info.flagCode;
  }
});

/**
 * Get flag code for a country by name or ISO code
 * @param countryInput - Country name or ISO code
 * @returns Flag code for flag-icons library
 */
export function getCountryFlagCode(
  countryInput: string | null | undefined
): string {
  if (!countryInput) {
    return "xx"; // Default flag for unknown countries
  }

  const input = countryInput.trim();

  // First check exact matches
  if (COUNTRY_MAP[input]) {
    return COUNTRY_MAP[input].flagCode;
  }

  // Check ISO code mappings
  if (ISO_TO_FLAG[input]) {
    return ISO_TO_FLAG[input];
  }

  // Check common variations
  const lowerInput = input.toLowerCase();
  if (COMMON_VARIATIONS[lowerInput]) {
    return COMMON_VARIATIONS[lowerInput];
  }

  // Try to extract 2-letter code if input looks like an ISO code
  if (input.length === 2 && /^[A-Za-z]{2}$/.test(input)) {
    return input.toLowerCase();
  }

  // Fallback: try first 2 letters of the input
  return input.toLowerCase().slice(0, 2);
}

/**
 * Get full country information
 * @param countryInput - Country name or ISO code
 * @returns CountryInfo object or null if not found
 */
export function getCountryInfo(
  countryInput: string | null | undefined
): CountryInfo | null {
  if (!countryInput) {
    return null;
  }

  const input = countryInput.trim();

  // Check exact matches
  if (COUNTRY_MAP[input]) {
    return COUNTRY_MAP[input];
  }

  // Check ISO code mappings
  if (ISO_TO_FLAG[input]) {
    const flagCode = ISO_TO_FLAG[input];
    // Find the country info by flag code
    const country = Object.values(COUNTRY_MAP).find(
      (info) => info.flagCode === flagCode
    );
    return country || null;
  }

  return null;
}

/**
 * Get all available countries
 * @returns Array of all country information
 */
export function getAllCountries(): CountryInfo[] {
  return Object.values(COUNTRY_MAP);
}
