import axios from "axios";

// --- CACHING LAYER ---
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function fetchWithCache(key, fetcher) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[CACHE HIT] ${key}`);
    return cached.data;
  }
  console.log(`[CACHE MISS] ${key}`);
  const data = await fetcher();
  cache.set(key, { timestamp: Date.now(), data });
  return data;
}

// --- 1. AIRPORT MAPPING LOGIC ---
export const AIRPORT_MAP = {
    // Major Indian Cities
    "mumbai": "BOM", "bombay": "BOM",
    "delhi": "DEL", "new delhi": "DEL",
    "jaipur": "JAI",
    "bangalore": "BLR", "bengaluru": "BLR",
    "goa": "GOI",
    "pune": "PNQ",
    "chennai": "MAA", "madras": "MAA",
    "kolkata": "CCU", "calcutta": "CCU",
    "hyderabad": "HYD",
    "ahmedabad": "AMD",
    "lucknow": "LKO",
    "amritsar": "ATQ",
    "prayagraj": "IXD", "allahabad": "IXD",
    "varanasi": "VNS", "banaras": "VNS",
    "patna": "PAT",
    "indore": "IDR",
    "bhopal": "BHO",
    "nagpur": "NAG",
    "chandigarh": "IXC",
    "srinagar": "SXR",
    "guwahati": "GAU",
    "kochi": "COK", "cochin": "COK",
    "trivandrum": "TRV", "thiruvananthapuram": "TRV",
    "coimbatore": "CJB",
    "vadodara": "BDQ",
    "madurai": "IXM",
    "raipur": "RPR",
    "ranchi": "IXR",
    "bhubaneswar": "BBI",
    "visakhapatnam": "VTZ", "vizag": "VTZ",
    "surat": "STV",

    // Major International Cities
    "paris": "CDG",
    "london": "LHR",
    "new york": "JFK", "nyc": "JFK",
    "dubai": "DXB",
    "singapore": "SIN",
    "bangkok": "BKK",
    "tokyo": "HND",
    "sydney": "SYD",
    "toronto": "YYZ",
    "los angeles": "LAX", "la": "LAX",
    "san francisco": "SFO",
    "chicago": "ORD",
    "rome": "FCO",
    "amsterdam": "AMS",
    "frankfurt": "FRA",
    "madrid": "MAD",
    "barcelona": "BCN",
    "istanbul": "IST",
    "kuala lumpur": "KUL",
    "hong kong": "HKG",
    "seoul": "ICN",
    "beijing": "PEK",
    "shanghai": "PVG",
    "cairo": "CAI",
    "johannesburg": "JNB",
    "doha": "DOH",
    "abudhabi": "AUH", "abu dhabi": "AUH",
    "malé": "MLE", "male": "MLE", "maldives": "MLE"
};

export const getIataCode = (input) => {
    if (!input) return "";
    const cleanInput = input.trim().toLowerCase();
    if (AIRPORT_MAP[cleanInput]) return AIRPORT_MAP[cleanInput];
    // If input is already a 3-letter code (like DEL, CDG, IXD), use it directly
    if (cleanInput.length === 3) return cleanInput.toUpperCase();
    // Otherwise return uppercase string without blind 3-letter slicing
    return input.trim().toUpperCase();
};


export async function geocodeCity(city) {
  const url = `https://api.openrouteservice.org/geocode/search`;

  const response = await axios.get(url, {
    params: {
      api_key: process.env.OPENROUTE_KEY,
      text: city,
      size: 1
    }
  });

  if (!response.data.features.length) {
    throw new Error(`Location not found: ${city}`);
  }

  const [lng, lat] = response.data.features[0].geometry.coordinates;
  return { lat, lng };
}
