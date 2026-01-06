/**
 * Extract state abbreviation from a location string
 * Handles both full state names and location strings with state abbreviations
 * (e.g., "San Francisco, CA" or "California")
 */
export function extractState(location: string): string | null {
  const stateAbbreviations: Record<string, string> = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    "west virginia": "WV",
    wisconsin: "WI",
    wyoming: "WY",
    "district of columbia": "DC",
  };
  const validAbbrevs = new Set(Object.values(stateAbbreviations));

  const locationLower = location.toLowerCase().trim();

  // Check if it's a full state name
  if (stateAbbreviations[locationLower]) {
    return stateAbbreviations[locationLower];
  }

  // Try to extract abbreviation from location (e.g., "San Francisco, CA")
  const parts = location.split(/[,\s]+/);
  for (const part of parts) {
    const upper = part.toUpperCase();
    if (validAbbrevs.has(upper)) {
      return upper;
    }
  }

  return null;
}

/**
 * Sanitize error messages to remove potentially sensitive information
 */
export function sanitizeErrorText(errorText: string): string {
  let sanitized = errorText;

  // Remove JWT tokens (Bearer tokens in error messages)
  sanitized = sanitized.replace(
    /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/gi,
    "Bearer [REDACTED]"
  );

  return sanitized;
}
