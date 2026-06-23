import React, { useState } from "react";
import axios from "axios";
import Nav from "../components/Nav";
import "../styles/Dashboard.css";
import "../styles/Compare.css";

export default function Compare() {
  const [cityA, setCityA] = useState("");
  const [cityB, setCityB] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const fetchCityData = async (city) => {
    const [weatherRes, hotelsRes, eventsRes] = await Promise.allSettled([
      axios.get(`${import.meta.env.VITE_API_URL}/api/weather?city=${city}`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/hotels`, {
        params: { city, check_in: startDate, check_out: endDate }
      }),
      axios.get(`${import.meta.env.VITE_API_URL}/api/events`, {
        params: { city, start_date: startDate, end_date: endDate }
      })
    ]);

    // Weather - get average temp
    let avgTemp = null;
    if (weatherRes.status === "fulfilled") {
      const list = weatherRes.value.data.list || [];
      if (list.length > 0) {
        avgTemp = Math.round(list.reduce((sum, w) => sum + w.main.temp, 0) / list.length);
      }
    }

    // Hotels - cheapest price
    let cheapestHotel = null;
    let hotelCount = 0;
    if (hotelsRes.status === "fulfilled") {
      const hotels = hotelsRes.value.data.hotels || [];
      hotelCount = hotels.length;
      const priced = hotels
        .map(h => ({ ...h, numPrice: parseInt((h.price || "0").replace(/[₹,]/g, "")) || 0 }))
        .filter(h => h.numPrice > 0)
        .sort((a, b) => a.numPrice - b.numPrice);
      cheapestHotel = priced[0] || null;
    }

    // Events
    let eventCount = 0;
    let topEvents = [];
    if (eventsRes.status === "fulfilled") {
      const events = eventsRes.value.data.events || [];
      eventCount = events.length;
      topEvents = events.slice(0, 3);
    }

    return { city, avgTemp, cheapestHotel, hotelCount, eventCount, topEvents };
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!cityA || !cityB || !startDate || !endDate) return;

    setLoading(true);
    setResults(null);

    try {
      const [dataA, dataB] = await Promise.all([
        fetchCityData(cityA),
        fetchCityData(cityB)
      ]);
      setResults({ a: dataA, b: dataB });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getVerdict = () => {
    if (!results) return "";
    const { a, b } = results;

    let scoreA = 0, scoreB = 0;

    // Cheaper hotel wins
    const priceA = a.cheapestHotel?.numPrice || Infinity;
    const priceB = b.cheapestHotel?.numPrice || Infinity;
    if (priceA < priceB) scoreA++;
    else if (priceB < priceA) scoreB++;

    // More events wins
    if (a.eventCount > b.eventCount) scoreA++;
    else if (b.eventCount > a.eventCount) scoreB++;

    // More hotels available wins
    if (a.hotelCount > b.hotelCount) scoreA++;
    else if (b.hotelCount > a.hotelCount) scoreB++;

    if (scoreA > scoreB) return `🏆 ${a.city} is the better choice — cheaper stays and more options!`;
    if (scoreB > scoreA) return `🏆 ${b.city} is the better choice — cheaper stays and more options!`;
    return "🤝 Both destinations are equally great — pick based on your vibe!";
  };

  return (
    <div className="background-containerr">
      <Nav />
      <div className="background-content">
        <header className="events-header">
          <h2 className="section-title">Compare Destinations</h2>
          <p style={{ color: "#aaa" }}>See which city suits your trip better</p>
        </header>

        <form onSubmit={handleCompare} className="compare-form">
          <div className="compare-inputs">
            <input
              type="text"
              placeholder="City A (e.g. Goa)"
              value={cityA}
              onChange={(e) => setCityA(e.target.value)}
              required
            />
            <span className="vs-badge">VS</span>
            <input
              type="text"
              placeholder="City B (e.g. Pondicherry)"
              value={cityB}
              onChange={(e) => setCityB(e.target.value)}
              required
            />
          </div>
          <div className="compare-dates">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <button type="submit" className="explore-btn" disabled={loading} style={{ maxWidth: "300px" }}>
            {loading ? "Comparing..." : "Compare Now"}
          </button>
        </form>

        {results && (
          <div className="compare-results">
            <div className="compare-grid">
              {[results.a, results.b].map((data, i) => (
                <div key={i} className="compare-card">
                  <h3 className="compare-city">{data.city}</h3>

                  <div className="compare-stat">
                    <span className="stat-label">🌡️ Avg Temperature</span>
                    <span className="stat-value">{data.avgTemp ? `${data.avgTemp}°C` : "N/A"}</span>
                  </div>

                  <div className="compare-stat">
                    <span className="stat-label">🏨 Hotels Available</span>
                    <span className="stat-value">{data.hotelCount}</span>
                  </div>

                  <div className="compare-stat">
                    <span className="stat-label">💰 Cheapest Hotel</span>
                    <span className="stat-value">
                      {data.cheapestHotel ? `₹${data.cheapestHotel.price}/night` : "N/A"}
                    </span>
                  </div>

                  <div className="compare-stat">
                    <span className="stat-label">🎉 Events Found</span>
                    <span className="stat-value">{data.eventCount}</span>
                  </div>

                  {data.topEvents.length > 0 && (
                    <div className="compare-events">
                      <p className="stat-label">Top Events:</p>
                      {data.topEvents.map((e, idx) => (
                        <p key={idx} className="mini-event">• {e.title}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="verdict-box">
              <p>{getVerdict()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
