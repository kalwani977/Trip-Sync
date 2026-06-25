import axios from "axios";

export const generateItinerary = async (req, res) => {
    try {
        const { destination, startDate, endDate, budget, flights, hotels, events, weather } = req.body;

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is not configured in .env" });
        }

        // Strip down the data to only essential fields to prevent hitting the 6000 TPM Groq Rate Limit
        const minimalFlights = (flights || []).map(f => ({
            airline: f.airline,
            dep: f.departure_time,
            arr: f.arrival_time,
            price: f.price
        }));

        const minimalHotels = (hotels || []).map(h => ({
            name: h.name,
            price: h.price,
            rating: h.rating
        }));

        const minimalEvents = (events || []).slice(0, 5).map(e => ({
            title: e.title,
            time: e.time,
            venue: e.venue
        }));

        const minimalWeather = (weather || []).filter((w, i) => i % 8 === 0).map(w => ({
            date: w.dt_txt,
            temp: w.main?.temp,
            desc: w.weather?.[0]?.description
        }));

        const prompt = `
        You are TripSync AI, an expert AI travel planner.
        Create a detailed, day-by-day itinerary for a trip to ${destination} from ${startDate} to ${endDate}.
        Budget preference: ${budget || "Standard"}.
        
        Available Data to incorporate (USE THIS SPARINGLY):
        Flights: ${JSON.stringify(minimalFlights)}
        Hotels: ${JSON.stringify(minimalHotels)}
        Events/Attractions: ${JSON.stringify(minimalEvents)}
        Weather: ${JSON.stringify(minimalWeather)}
        
        You must output ONLY a valid JSON object with an "itinerary" array.
        Format strictly as:
        {
          "itinerary": [
            {
              "day": 1,
              "date": "YYYY-MM-DD",
              "title": "Arrival & Exploring",
              "activities": [
                { "time": "Morning", "title": "Check-in at Hotel X", "description": "Get settled in." },
                { "time": "Afternoon", "title": "Visit Attraction Y", "description": "Explore the local culture." },
                { "time": "Evening", "title": "Dinner at Z", "description": "Taste local cuisine." }
              ]
            }
          ]
        }
        `;

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "You are an AI travel assistant that outputs ONLY valid JSON. Your response must be parseable by JSON.parse()." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const content = response.data.choices[0].message.content;
        
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch(e) {
            console.warn("Direct JSON parse failed, trying to extract JSON block...");
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                throw new Error("AI returned unparseable text.");
            }
        }
        
        res.json({ success: true, plan: parsed.itinerary || parsed });

    } catch (err) {
        console.error("GROQ AI ERROR:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to generate AI itinerary", details: err.message });
    }
};
