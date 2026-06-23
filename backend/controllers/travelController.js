import axios from "axios";
import { getJson } from "serpapi";

// --- CACHING LAYER ---
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

async function fetchWithCache(key, fetcher) {
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
const AIRPORT_MAP = {
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
    "paris" :"CDG"
};

const getIataCode = (input) => {
    if (!input) return "";
    const cleanInput = input.trim().toLowerCase();
    return AIRPORT_MAP[cleanInput] || input.trim().toUpperCase();
};

async function geocodeCity(city) {
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

export const getEvents = async (req, res) => {
    const { city, start_date, end_date } = req.query;
    const formatDate = d => d.replaceAll("-", "");

    try {
        const response = await fetchWithCache(`events_${city.toLowerCase()}_${formatDate(start_date)}_${formatDate(end_date)}`, async () => {
            return await getJson({
                engine: "google_events",
                q: `Events in ${city}`,
                hl: "en",
                gl: "in",
                htichips: `date:custom,${formatDate(start_date)},${formatDate(end_date)}`,
                api_key: process.env.SERPAPI_KEY
            });
        });

        const cleanEvents = (response.events_results || []).map(e => ({
            title: e.title || "",
            date: e.date?.start_date || "",
            time: e.date?.when || "",
            venue: e.venue?.name || "",
            address: e.address?.join(", ") || "",
            image: e.image || e.thumbnail || "", 
            ticket_link: e.link || ""
        }));

        res.json({ count: cleanEvents.length, events: cleanEvents });
    } catch (err) {
        res.status(500).json({ error: "Events search failed" });
    }
};

export const getFlights = async (req, res) => {
    let { from, to, out_date } = req.query;

    if (!from || !to || !out_date) {
        return res.status(400).json({ 
            error: "Missing parameters", 
            message: "You must provide 'from', 'to', and 'out_date' (YYYY-MM-DD)" 
        });
    }

    const departure_id = getIataCode(from);
    const arrival_id = getIataCode(to);

    try {
        const response = await fetchWithCache(`flights_${departure_id}_${arrival_id}_${out_date}`, async () => {
            return await getJson({
                engine: "google_flights",
                departure_id: departure_id,
                arrival_id: arrival_id,
                outbound_date: out_date,
                currency: "INR",
                hl: "en",
                type: "2", // One way
                api_key: process.env.SERPAPI_KEY
            });
        });

        const allFlights = response.best_flights || response.other_flights || [];

        const simplifiedFlights = allFlights.map(f => {
            const firstLeg = f.flights[0];
            const lastLeg = f.flights[f.flights.length - 1];

            return {
                airline: firstLeg.airline,
                airline_logo: firstLeg.airline_logo,
                flight_number: firstLeg.flight_number,
                
                departure_airport: firstLeg.departure_airport.name,
                departure_time: firstLeg.departure_airport.time,
                
                arrival_airport: lastLeg.arrival_airport.name,
                arrival_time: lastLeg.arrival_airport.time,
                
                duration: f.total_duration,
                price: f.price
            };
        });

        res.json({
            from: departure_id,
            to: arrival_id,
            count: simplifiedFlights.length,
            flights: simplifiedFlights
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Flight search failed", details: err.message });
    }
};

export const getHotels = async (req, res) => {
    const { city, check_in, check_out } = req.query;

    if (!city || !check_in || !check_out) {
        return res.status(400).json({ 
            error: "Missing parameters", 
            message: "Provide 'city', 'check_in' (YYYY-MM-DD), and 'check_out' (YYYY-MM-DD)" 
        });
    }

    try {
        const response = await fetchWithCache(`hotels_${city.toLowerCase()}_${check_in}_${check_out}`, async () => {
            return await getJson({
                engine: "google_hotels",
                q: `hotels in ${city}`,
                check_in_date: check_in,
                check_out_date: check_out,
                currency: "INR",
                hl: "en",
                api_key: process.env.SERPAPI_KEY
            });
        });

        const hotels = response.properties || [];
        
        const cleanHotels = hotels.map(h => ({
            name: h.name,
            price: h.rate_per_night?.lowest || "N/A",
            rating: h.overall_rating,
            reviews: h.reviews,
            thumbnail: h.images?.[0]?.thumbnail,
            link: h.link,
            description: h.description
        }));

        res.json({ city, count: cleanHotels.length, hotels: cleanHotels });

    } catch (err) {
        res.status(500).json({ error: "Hotel search failed", details: err.message });
    }
};

export const getRoute = async (req, res) => {
    const { start, end, mode } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: "Please provide both start and end locations." });
    }

    try {
        const response = await getJson({
            engine: "google_maps_directions",
            start_addr: start,
            end_addr: end,
            travel_mode: mode || "0", 
            api_key: process.env.SERPAPI_KEY
        });

        const routeData = response.directions?.[0] || {};
        
        res.json({
            origin: start,
            destination: end,
            distance: routeData.formatted_distance || "N/A",
            duration: routeData.formatted_duration || "N/A",
            steps: routeData.legs?.[0]?.steps || []
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch route data" });
    }
};

export const getMapRoute = async (req, res) => {
  try {
    const { startCity, endCity, mode } = req.body;

    if (!startCity || !endCity) {
      return res.status(400).json({ error: "Start or End city missing" });
    }

    const start = await geocodeCity(startCity);
    const end = await geocodeCity(endCity);

    const routeResponse = await axios.post(
      `https://api.openrouteservice.org/v2/directions/${mode}/geojson`,
      {
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat]
        ]
      },
      {
        headers: {
          Authorization: process.env.OPENROUTE_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      startCity,
      endCity,
      mode,
      route: routeResponse.data
    });

  } catch (error) {
    console.error("OPENROUTE ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get route" });
  }
};

export const getWeather = async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: "City is required" });

  try {
    const data = await fetchWithCache(`weather_${city.toLowerCase()}`, async () => {
      const response = await axios.get("https://api.openweathermap.org/data/2.5/forecast", {
        params: { q: city, units: "metric", appid: process.env.OPENWEATHER_API_KEY }
      });
      return response.data;
    });
    res.json(data);
  } catch (err) {
    console.error("WEATHER ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Weather fetch failed", details: err.response?.data || err.message });
  }
};

export const orchestrateTrip = async (req, res) => {
  const { startCity, destination, startDate, endDate } = req.body;

  if (!startCity || !destination || !startDate || !endDate) {
    return res.status(400).json({ error: "All fields required: startCity, destination, startDate, endDate" });
  }

  const results = {
    timestamp: new Date().toISOString(),
    trip: { startCity, destination, startDate, endDate },
    agents: {}
  };

  const agentCalls = [
    // Weather Agent
    fetchWithCache(`weather_${destination.toLowerCase()}`, async () => {
      const response = await axios.get("https://api.openweathermap.org/data/2.5/forecast", {
        params: { q: destination, units: "metric", appid: process.env.OPENWEATHER_API_KEY }
      });
      return response.data;
    }).then(data => {
      results.agents.weather = {
        agent: "weather",
        status: "success",
        timestamp: new Date().toISOString(),
        data: { forecast: data.list?.slice(0, 10) || [] }
      };
    }).catch((err) => {
      console.error("Agent Failed:", err.message);
      results.agents.weather = { agent: "weather", status: "failed", timestamp: new Date().toISOString(), data: null };
    }),

    // Route Agent
    fetchWithCache(`route_${startCity.toLowerCase()}_${destination.toLowerCase()}`, async () => {
      const start = await geocodeCity(startCity);
      const end = await geocodeCity(destination);
      const routeRes = await axios.post(
        `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
        { coordinates: [[start.lng, start.lat], [end.lng, end.lat]] },
        { headers: { Authorization: process.env.OPENROUTE_KEY, "Content-Type": "application/json" } }
      );
      return routeRes.data;
    }).then(data => {
      const summary = data.features?.[0]?.properties?.summary;
      results.agents.route = {
        agent: "route",
        status: "success",
        timestamp: new Date().toISOString(),
        data: {
          distance: summary ? (summary.distance / 1000).toFixed(1) + " km" : "N/A",
          duration: summary ? (summary.duration / 60).toFixed(0) + " mins" : "N/A"
        }
      };
    }).catch((err) => {
      console.error("Agent Failed:", err.message);
      results.agents.route = { agent: "route", status: "failed", timestamp: new Date().toISOString(), data: null };
    }),

    // Flight Agent
    fetchWithCache(`flights_${getIataCode(startCity)}_${getIataCode(destination)}_${startDate}`, async () => {
      return await getJson({
        engine: "google_flights",
        departure_id: getIataCode(startCity),
        arrival_id: getIataCode(destination),
        outbound_date: startDate,
        currency: "INR",
        hl: "en",
        type: "2",
        api_key: process.env.SERPAPI_KEY
      });
    }).then(response => {
      const flights = (response.best_flights || response.other_flights || []).slice(0, 5);
      results.agents.flights = {
        agent: "flights",
        status: "success",
        timestamp: new Date().toISOString(),
        data: { count: flights.length, cheapest: flights[0]?.price || null }
      };
    }).catch((err) => {
      console.error("Agent Failed:", err.message);
      results.agents.flights = { agent: "flights", status: "failed", timestamp: new Date().toISOString(), data: null };
    }),

    // Hotel Agent
    fetchWithCache(`hotels_${destination.toLowerCase()}_${startDate}_${endDate}`, async () => {
      return await getJson({
        engine: "google_hotels",
        q: `hotels in ${destination}`,
        check_in_date: startDate,
        check_out_date: endDate,
        currency: "INR",
        hl: "en",
        api_key: process.env.SERPAPI_KEY
      });
    }).then(response => {
      const hotels = response.properties || [];
      results.agents.hotels = {
        agent: "hotels",
        status: "success",
        timestamp: new Date().toISOString(),
        data: { count: hotels.length, cheapest: hotels[0]?.rate_per_night?.lowest || null }
      };
    }).catch((err) => {
      console.error("Agent Failed:", err.message);
      results.agents.hotels = { agent: "hotels", status: "failed", timestamp: new Date().toISOString(), data: null };
    }),

    // Events Agent
    fetchWithCache(`events_${destination.toLowerCase()}_${startDate.replaceAll("-", "")}_${endDate.replaceAll("-", "")}`, async () => {
      return await getJson({
        engine: "google_events",
        q: `Events in ${destination}`,
        hl: "en",
        gl: "in",
        htichips: `date:custom,${startDate.replaceAll("-", "")},${endDate.replaceAll("-", "")}`,
        api_key: process.env.SERPAPI_KEY
      });
    }).then(response => {
      const events = response.events_results || [];
      results.agents.events = {
        agent: "events",
        status: "success",
        timestamp: new Date().toISOString(),
        data: { count: events.length, top: events.slice(0, 3).map(e => e.title) }
      };
    }).catch((err) => {
      console.error("Agent Failed:", err.message);
      results.agents.events = { agent: "events", status: "failed", timestamp: new Date().toISOString(), data: null };
    })
  ];

  await Promise.allSettled(agentCalls);

  res.json(results);
};
