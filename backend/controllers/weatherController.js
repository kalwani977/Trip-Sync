import axios from "axios";
import { fetchWithCache } from "../utils/travelUtils.js";

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
