import { getJson } from "serpapi";
import { fetchWithCache } from "../utils/travelUtils.js";

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
        console.error("HOTEL SEARCH ERROR:", err.message);
        res.status(500).json({ error: "Hotel search failed", details: err.message });
    }
};
