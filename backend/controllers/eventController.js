import { getJson } from "serpapi";
import { fetchWithCache } from "../utils/travelUtils.js";

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
        console.error("EVENT SEARCH ERROR:", err.message);
        res.status(500).json({ error: "Events search failed" });
    }
};
