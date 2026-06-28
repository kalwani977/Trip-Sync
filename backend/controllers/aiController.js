import axios from "axios";

export const generateItinerary = async (req, res) => {
    try {
        const { destination, startDate, endDate, budget, flights, hotels, events, weather, preferences } = req.body;

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

        // Build preferences section for the prompt
        let preferencesSection = "";
        if (preferences) {
            const parts = [];
            if (preferences.travelStyle && preferences.travelStyle.length > 0) {
                parts.push(`Travel Style: ${preferences.travelStyle.join(", ")}`);
            }
            if (preferences.interests) {
                parts.push(`Interests: ${preferences.interests}`);
            }
            if (preferences.pace) {
                parts.push(`Pace: ${preferences.pace === "packed" ? "Packed schedule with lots of activities" : preferences.pace === "relaxed" ? "Relaxed pace with plenty of downtime" : "Moderate pace"}`);
            }
            if (preferences.mustSee) {
                parts.push(`Must-see places: ${preferences.mustSee}`);
            }
            if (preferences.dietary && preferences.dietary.length > 0) {
                parts.push(`Dietary preferences: ${preferences.dietary.join(", ")}`);
            }
            if (preferences.avoid) {
                parts.push(`Places/things to avoid: ${preferences.avoid}`);
            }
            if (parts.length > 0) {
                preferencesSection = `\n        User Preferences (IMPORTANT — tailor the itinerary to these):\n        ${parts.join("\n        ")}`;
            }
        }

        const prompt = `
        You are TripSync AI, an expert AI travel planner.
        Create a detailed, day-by-day itinerary for a trip to ${destination} from ${startDate} to ${endDate}.
        Budget preference: ${budget || "Standard"}.
        ${preferencesSection}
        
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

export const regenerateDay = async (req, res) => {
    try {
        const { destination, startDate, endDate, budget, dayNumber, dayDate, existingPlan, preferences } = req.body;

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is not configured in .env" });
        }

        // Build preferences section
        let preferencesSection = "";
        if (preferences) {
            const parts = [];
            if (preferences.travelStyle && preferences.travelStyle.length > 0) {
                parts.push(`Travel Style: ${preferences.travelStyle.join(", ")}`);
            }
            if (preferences.interests) {
                parts.push(`Interests: ${preferences.interests}`);
            }
            if (preferences.pace) {
                parts.push(`Pace: ${preferences.pace === "packed" ? "Packed schedule" : preferences.pace === "relaxed" ? "Relaxed pace" : "Moderate pace"}`);
            }
            if (preferences.mustSee) {
                parts.push(`Must-see: ${preferences.mustSee}`);
            }
            if (preferences.dietary && preferences.dietary.length > 0) {
                parts.push(`Dietary: ${preferences.dietary.join(", ")}`);
            }
            if (preferences.avoid) {
                parts.push(`Avoid: ${preferences.avoid}`);
            }
            if (parts.length > 0) {
                preferencesSection = `\n        User Preferences: ${parts.join(", ")}`;
            }
        }

        // Summarize existing plan context (what other days look like) to avoid repetition
        const otherDaysSummary = (existingPlan || [])
            .filter(d => d.day !== dayNumber)
            .slice(0, 3)
            .map(d => `Day ${d.day}: ${d.title} (${d.activities?.map(a => a.title).join(", ")})`)
            .join("; ");

        const prompt = `
        You are TripSync AI. Regenerate ONLY Day ${dayNumber} (${dayDate}) of a trip to ${destination} (${startDate} to ${endDate}).
        Budget: ${budget || "Standard"}.
        ${preferencesSection}
        
        Other days already planned (avoid repeating these activities): ${otherDaysSummary || "None"}
        
        Create a DIFFERENT and fresh plan for this day. Be creative and suggest new activities.
        
        Output ONLY valid JSON in this exact format:
        {
          "day": ${dayNumber},
          "date": "${dayDate}",
          "title": "Day Title Here",
          "activities": [
            { "time": "Morning", "title": "Activity Name", "description": "Brief description." },
            { "time": "Afternoon", "title": "Activity Name", "description": "Brief description." },
            { "time": "Evening", "title": "Activity Name", "description": "Brief description." }
          ]
        }
        `;

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "You are an AI travel assistant that outputs ONLY valid JSON. Your response must be parseable by JSON.parse()." },
                { role: "user", content: prompt }
            ],
            temperature: 0.9,
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
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                throw new Error("AI returned unparseable text.");
            }
        }
        
        res.json({ success: true, dayPlan: parsed });

    } catch (err) {
        console.error("GROQ AI REGENERATE DAY ERROR:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to regenerate day", details: err.message });
    }
};
