import axios from "axios";
import { getJson } from "serpapi";
import { fetchWithCache, getIataCode, geocodeCity } from "../utils/travelUtils.js";

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
