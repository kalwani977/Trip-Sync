import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/Events.css";
import toast from "react-hot-toast";

export default function Events() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tripId = searchParams.get("tripId");

  const [trip, setTrip] = useState(location.state?.trip || null);
  const initialData = location.state?.initialData;
  const [events, setEvents] = useState(initialData?.events || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const city = trip?.destination;
  const startDate = trip?.start || trip?.startdate;
  const endDate = trip?.end || trip?.enddate;

  useEffect(() => {
    if (!trip && tripId) {
      const fetchTrip = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/itinerary/${tripId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && res.data.itinerary) {
            const itn = res.data.itinerary;
            setTrip({
              id: itn._id,
              destination: itn.destination,
              startDestination: itn.startDestination,
              start: itn.startdate,
              end: itn.enddate
            });
          }
        } catch (err) {
          console.error("Failed to fetch trip details", err);
          setError("Failed to load trip details. Please go back.");
        }
      };
      fetchTrip();
    }
  }, [trip, tripId]);

  /* ---------------- FETCH EVENTS ---------------- */
  useEffect(() => {
    if (city && startDate && endDate && (!initialData || !initialData.events)) fetchEvents();
  }, [city, startDate, endDate, initialData]);

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events`, {
        params: {
          city,
          start_date: startDate,
          end_date: endDate
        }
      });
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };


const handleAddToItinerary = async (event) => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please login first");
    return;
  }

  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/itinerary/event`,
      { itineraryId: trip.id, event },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("Event added to your Itinerary!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to add to itinerary.");
  }
};

  /* ---------------- UI ---------------- */
  return (
    <div className="background-containerr">
            <div className="background-content">

        <header className="events-header">
          <h2 className="section-title">Events in {city}</h2>
          <p className="events-subtitle">
            {startDate} — {endDate}
          </p>
        </header>

        {loading && <p className="loading-text">Loading events...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <div style={{ padding: "30px", background: "#2a2a2a", borderRadius: "10px", textAlign: "center", color: "#ccc", margin: "20px 0" }}>
            <p style={{ fontSize: "1.1rem" }}><b>No scheduled events found</b> in {city} for these exact dates ({startDate} to {endDate}).</p>
            <p style={{ fontSize: "0.9rem", color: "#888", marginTop: "8px" }}>Try expanding your dates or checking major nearby cities!</p>
          </div>
        )}

        <div className="travel-grid">
          {events.map((event, index) => (
            <div key={index} className="travel-card">
              <div className="card-image-wrapper">
                <img
                  src={
                    event.image
                      ? `${event.image}&w=1000&q=100`
                      : "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=100"
                  }
                  alt={event.title}
                />
              </div>

              <div className="card-details">
                <p className="card-category">EVENT</p>
                <h4 className="card-location">{event.title}</h4>
                <p className="card-date">
                  {event.date || "TBA"} | {event.time || "10:00"}
                </p>
                <p className="card-desc">
                  {event.venue || "Venue TBA"}
                </p>

                <div className="event-actions-row">
                  {event.ticket_link && (
                    <a href={event.ticket_link} target="_blank" rel="noreferrer" className="ev-ticket-btn">
                      Tickets
                    </a>
                  )}
                  <button className="ev-itn-btn" onClick={() => handleAddToItinerary(event)}>
                    + Itinerary
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
