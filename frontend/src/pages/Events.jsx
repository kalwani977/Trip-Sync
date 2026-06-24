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
  const [googleConnected, setGoogleConnected] = useState(false);

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

  /* ---------------- CHECK GOOGLE STATUS ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/google/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setGoogleConnected(res.data.connected))
      .catch(() => setGoogleConnected(false));
  }, []);

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

/* ---------------- ADD TO CALENDAR ---------------- */
const handleAddToCalendar = async (event) => {
  const token = localStorage.getItem("token");
  if (!googleConnected) {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/google/auth?token=${token}`;
    return;
  }

  // Ensure date is valid for Google
  const eventDate = event.date || trip.start;
  const safeEvent = {
    ...event,
    date: eventDate,
    time: event.time || "10:00"
  };

  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/google/add-event`,
      { event: safeEvent },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("Event synced to Google Calendar!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to add to Google Calendar.");
  }
};
  /* ---------------- UI ---------------- */
  return (
    <div className="background-containerr">
            <div className="background-content">
        {/* Google Calendar Status - subtle inline */}
        {!googleConnected && (
          <div className="gcal-bar">
            <span className="gcal-dot offline"></span>
            <p>Google Calendar not connected</p>
            <button 
              className="gcal-connect-btn"
              onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/google/auth?token=${localStorage.getItem('token')}`}
            >
              Connect
            </button>
          </div>
        )}
        {googleConnected && (
          <div className="gcal-bar connected">
            <span className="gcal-dot online"></span>
            <p>Google Calendar connected</p>
          </div>
        )}

        <header className="events-header">
          <h2 className="section-title">Events in {city}</h2>
          <p className="events-subtitle">
            {startDate} — {endDate}
          </p>
        </header>

        {loading && <p className="loading-text">Loading events...</p>}
        {error && <p className="error-text">{error}</p>}

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
                  <button className="ev-cal-btn" onClick={() => handleAddToCalendar(event)}>
                    + Calendar
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
