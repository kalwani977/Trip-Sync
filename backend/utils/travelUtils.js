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
    "mumbai": "BOM", 
    "delhi": "DEL", 
    "jaipur": "JAI", 
    "bangalore": "BLR", 
    "bengaluru": "BLR", 
    "goa": "GOI",
    "pune": "PNQ", 
    "chennai": "MAA", 
    "kolkata": "CCU",
    "hyderabad": "HYD", 
    "ahmedabad": "AMD", 
    "lucknow": "LKO",
    "paris" :"CDG",
    "amritsar": "ATQ"
};

export const getIataCode = (input) => {
    if (!input) return "";
    const cleanInput = input.trim().toLowerCase();
    return AIRPORT_MAP[cleanInput] || input.trim().substring(0, 3).toUpperCase();
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
