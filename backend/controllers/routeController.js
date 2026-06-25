import axios from "axios";
import { getJson } from "serpapi";
import { geocodeCity } from "../utils/travelUtils.js";

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
