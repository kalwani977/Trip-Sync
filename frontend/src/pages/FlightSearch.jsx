import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/Flights.css";
import toast from "react-hot-toast";

export default function Flights() {
  const location = useLocation();
  const trip = location.state?.trip;

  const source = trip?.startDestination;
  const destination = trip?.destination;
  const startDate = trip?.start;
  const endDate = trip?.end;

  const initialData = location.state?.initialData;
  const [goingFlights, setGoingFlights] = useState(initialData?.flights || []);
  const [returnFlights, setReturnFlights] = useState([]);

  const [selectedGoing, setSelectedGoing] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (source && destination && startDate && endDate) {
      fetchFlights();
    }
  }, [source, destination, startDate, endDate]);

  const fetchFlights = async () => {
    setLoading(true);
    setError("");

    try {
      const returnPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/flights`, {
        params: { from: destination, to: source, out_date: endDate },
      });

      if (!initialData || !initialData.flights) {
        const goingPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/flights`, {
          params: { from: source, to: destination, out_date: startDate },
        });
        const [goingRes, returnRes] = await Promise.all([goingPromise, returnPromise]);
        setGoingFlights(goingRes.data.flights || []);
        setReturnFlights(returnRes.data.flights || []);
      } else {
        const returnRes = await returnPromise;
        setReturnFlights(returnRes.data.flights || []);
      }
    } catch (err) {
      setError("Failed to fetch flights");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlight = async (flight, type) => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please login first");
    return;
  }

  try {
    if (type === "going") {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/itinerary/flight`,
        {
          itineraryId: trip.id,
          flightdetails: flight,   // exact key backend expects
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedGoing(flight);
    }

    if (type === "return") {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/itinerary/returnflight`,
        {
          itineraryId: trip.id,
          returnflight: flight,   // exact key backend expects
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedReturn(flight);
    }

    toast.success(`Flight added (${type})`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    toast.error("Failed to add flight");
  }
};

  const renderFlightCard = (flight, index, type) => {
    const isDisabled =
      (type === "going" && selectedGoing) ||
      (type === "return" && selectedReturn);

    // Check if this is the cheapest flight
    const flightList = type === "going" ? goingFlights : returnFlights;
    const cheapestPrice = Math.min(...flightList.map(f => f.price || Infinity));
    const isCheapest = flight.price === cheapestPrice && flightList.length > 1;

    return (
      <div key={index} className="flight-card">
        {isCheapest && <span className="best-value-badge">Best Value</span>}
        <div className="flight-header">
          {flight.airline_logo && (
            <img src={flight.airline_logo} alt={flight.airline} />
          )}
          <h3>{flight.airline}</h3>
        </div>

        <p><b>Flight No:</b> {flight.flight_number}</p>
        <p><b>Departure:</b> {flight.departure_airport} — {flight.departure_time}</p>
        <p><b>Arrival:</b> {flight.arrival_airport} — {flight.arrival_time}</p>
        <p><b>Duration:</b> {flight.duration} mins</p>
        <p><b>Price:</b> ₹{flight.price}</p>

        <button
          className="add-flight-btn"
          disabled={isDisabled}
          onClick={() => handleAddFlight(flight, type)}
        >
          {isDisabled ? "Selected" : "Add to Itinerary"}
        </button>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      
      <main className="flights-page">
        <header className="flights-header">
          <h1 className="flights-title">Flights for your Trip</h1>
          <p>{source} ⇄ {destination}</p>
        </header>

        {loading && <p className="status-msg">Loading flights...</p>}
        {error && <p className="status-msg error">{error}</p>}

        {/* LEFT / RIGHT SPLIT */}
        <div className="flights-split">

          {/* GOING */}
          <section className="flights-section">
            
                 <h2 >Going: {source} → {destination}</h2>
         
           
            <p className="flight-date">{startDate}</p>

            <div className="flights-grid">
              {!loading && !error && goingFlights.length === 0 && (
                <div style={{ padding: "20px", background: "#2a2a2a", borderRadius: "8px", margin: "15px 0", color: "#ccc", gridColumn: "1 / -1" }}>
                  <p>ℹ️ <b>No direct flights found</b> between {source} and {destination} on {startDate}.</p>
                  <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "5px" }}>Try searching from major nearby international hub airports or alternate dates.</p>
                </div>
              )}
              {goingFlights.map((f, i) =>
                renderFlightCard(f, i, "going")
              )}
            </div>
          </section>

          {/* RETURN */}
          <section className="flights-section">
            <h2>↩️ Return: {destination} → {source}</h2>
            <p className="flight-date">{endDate}</p>

            <div className="flights-grid">
              {!loading && !error && returnFlights.length === 0 && (
                <div style={{ padding: "20px", background: "#2a2a2a", borderRadius: "8px", margin: "15px 0", color: "#ccc", gridColumn: "1 / -1" }}>
                  <p>ℹ️ <b>No return flights found</b> between {destination} and {source} on {endDate}.</p>
                  <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "5px" }}>Try searching from major nearby international hub airports or alternate dates.</p>
                </div>
              )}
              {returnFlights.map((f, i) =>
                renderFlightCard(f, i, "return")
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
