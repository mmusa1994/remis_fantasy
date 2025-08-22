// Country code to flag emoji mapping
export const countryFlags: { [key: string]: string } = {
  // Popular European countries
  'Bosnia and Herzegovina': '🇧🇦',
  'Serbia': '🇷🇸', 
  'Croatia': '🇭🇷',
  'Montenegro': '🇲🇪',
  'Slovenia': '🇸🇮',
  'North Macedonia': '🇲🇰',
  'Albania': '🇦🇱',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'United Kingdom': '🇬🇧',
  'Netherlands': '🇳🇱',
  'Austria': '🇦🇹',
  'Switzerland': '🇨🇭',
  'Belgium': '🇧🇪',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿',
  'Slovakia': '🇸🇰',
  'Hungary': '🇭🇺',
  'Romania': '🇷🇴',
  'Bulgaria': '🇧🇬',
  'Greece': '🇬🇷',
  'Turkey': '🇹🇷',
  'Portugal': '🇵🇹',
  'Ireland': '🇮🇪',
  'Iceland': '🇮🇸',
  'Luxembourg': '🇱🇺',
  
  // Americas
  'United States': '🇺🇸',
  'Canada': '🇨🇦',
  'Mexico': '🇲🇽',
  'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Peru': '🇵🇪',
  'Venezuela': '🇻🇪',
  'Ecuador': '🇪🇨',
  'Uruguay': '🇺🇾',
  'Paraguay': '🇵🇾',
  'Bolivia': '🇧🇴',
  
  // Asia
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'South Korea': '🇰🇷',
  'India': '🇮🇳',
  'Russia': '🇷🇺',
  'Indonesia': '🇮🇩',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Philippines': '🇵🇭',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Sri Lanka': '🇱🇰',
  'Nepal': '🇳🇵',
  'Myanmar': '🇲🇲',
  'Cambodia': '🇰🇭',
  'Laos': '🇱🇦',
  'Mongolia': '🇲🇳',
  'Kazakhstan': '🇰🇿',
  'Uzbekistan': '🇺🇿',
  'Kyrgyzstan': '🇰🇬',
  'Tajikistan': '🇹🇯',
  'Turkmenistan': '🇹🇲',
  'Afghanistan': '🇦🇫',
  'Iran': '🇮🇷',
  'Iraq': '🇮🇶',
  'Syria': '🇸🇾',
  'Lebanon': '🇱🇧',
  'Jordan': '🇯🇴',
  'Israel': '🇮🇱',
  'Palestine': '🇵🇸',
  'Saudi Arabia': '🇸🇦',
  'UAE': '🇦🇪',
  'Kuwait': '🇰🇼',
  'Qatar': '🇶🇦',
  'Bahrain': '🇧🇭',
  'Oman': '🇴🇲',
  'Yemen': '🇾🇪',
  
  // Africa
  'South Africa': '🇿🇦',
  'Nigeria': '🇳🇬',
  'Egypt': '🇪🇬',
  'Kenya': '🇰🇪',
  'Morocco': '🇲🇦',
  'Algeria': '🇩🇿',
  'Tunisia': '🇹🇳',
  'Libya': '🇱🇾',
  'Sudan': '🇸🇩',
  'Ethiopia': '🇪🇹',
  'Ghana': '🇬🇭',
  'Ivory Coast': '🇨🇮',
  'Senegal': '🇸🇳',
  'Mali': '🇲🇱',
  'Burkina Faso': '🇧🇫',
  'Niger': '🇳🇪',
  'Chad': '🇹🇩',
  'Cameroon': '🇨🇲',
  'Central African Republic': '🇨🇫',
  'Democratic Republic of the Congo': '🇨🇩',
  'Republic of the Congo': '🇨🇬',
  'Gabon': '🇬🇦',
  'Equatorial Guinea': '🇬🇶',
  'Angola': '🇦🇴',
  'Zambia': '🇿🇲',
  'Zimbabwe': '🇿🇼',
  'Botswana': '🇧🇼',
  'Namibia': '🇳🇦',
  'Lesotho': '🇱🇸',
  'Swaziland': '🇸🇿',
  'Mozambique': '🇲🇿',
  'Madagascar': '🇲🇬',
  'Mauritius': '🇲🇺',
  'Seychelles': '🇸🇨',
  'Comoros': '🇰🇲',
  'Djibouti': '🇩🇯',
  'Eritrea': '🇪🇷',
  'Somalia': '🇸🇴',
  'Uganda': '🇺🇬',
  'Tanzania': '🇹🇿',
  'Rwanda': '🇷🇼',
  'Burundi': '🇧🇮',
  'Malawi': '🇲🇼',
  
  // Oceania
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
  'Papua New Guinea': '🇵🇬',
  'Fiji': '🇫🇯',
  'Solomon Islands': '🇸🇧',
  'Vanuatu': '🇻🇺',
  'Samoa': '🇼🇸',
  'Tonga': '🇹🇴',
  'Kiribati': '🇰🇮',
  'Tuvalu': '🇹🇻',
  'Nauru': '🇳🇷',
  'Palau': '🇵🇼',
  'Marshall Islands': '🇲🇭',
  'Micronesia': '🇫🇲',
};

// Function to get flag for country
export function getCountryFlag(countryName: string | null): string {
  if (!countryName) return '🌍'; // Default world emoji
  
  // Direct match
  if (countryFlags[countryName]) {
    return countryFlags[countryName];
  }
  
  // Try to find partial match (case insensitive)
  const normalizedCountry = countryName.toLowerCase();
  for (const [country, flag] of Object.entries(countryFlags)) {
    if (country.toLowerCase().includes(normalizedCountry) || normalizedCountry.includes(country.toLowerCase())) {
      return flag;
    }
  }
  
  // Special cases for common variations
  const specialCases: { [key: string]: string } = {
    'usa': '🇺🇸',
    'uk': '🇬🇧',
    'britain': '🇬🇧',
    'england': '🇬🇧',
    'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'northern ireland': '🇬🇧',
    'america': '🇺🇸',
    'korea': '🇰🇷',
    'south korea': '🇰🇷',
    'north korea': '🇰🇵',
    'czech': '🇨🇿',
    'russia': '🇷🇺',
    'russian federation': '🇷🇺',
    'uae': '🇦🇪',
    'emirates': '🇦🇪',
    'bosnia': '🇧🇦',
    'herzegovina': '🇧🇦',
    'macedonia': '🇲🇰',
    'fyrom': '🇲🇰',
  };
  
  for (const [key, flag] of Object.entries(specialCases)) {
    if (normalizedCountry.includes(key)) {
      return flag;
    }
  }
  
  return '🌍'; // Default fallback
}

// Function to get country name with flag
export function getCountryWithFlag(countryName: string | null): string {
  if (!countryName) return '🌍 Nepoznato';
  
  const flag = getCountryFlag(countryName);
  return `${flag} ${countryName}`;
}
