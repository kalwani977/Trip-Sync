import { getJson } from "serpapi";
import { fetchWithCache, getIataCode } from "../utils/travelUtils.js";

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
