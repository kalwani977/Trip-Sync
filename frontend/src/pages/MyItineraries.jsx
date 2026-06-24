import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/MyItineraries.css";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function MyItineraries() {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/itinerary`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setItineraries(res.data.itineraries || res.data || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load itineraries");
        setError("Failed to load itineraries.");
        setLoading(false);
      });
  }, []);

  const getDayCount = (start, end) => {
    if (!start || !end) return "—";
    const diff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} Day${diff !== 1 ? "s" : ""}`;
  };

  const capitalizeFirstLetter = (str) => {
    if (!str) return "";
    return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  };

  if (loading) {
    return (
      <div className="itineraries-page">
                <div className="itineraries-loading">Loading your trips...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="itineraries-page">
                <div className="itineraries-loading">{error}</div>
      </div>
    );
  }

  return (
    <div className="itineraries-page">
      
      <div className="itineraries-content">
        <header className="itineraries-header">
          <h1>My Itineraries</h1>
          <p className="trip-count">{itineraries.length} trip{itineraries.length !== 1 ? "s" : ""} planned</p>
        </header>

        {itineraries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">+</div>
            <p>No itineraries yet</p>
            <span className="empty-sub">Start planning your first adventure</span>
            <button onClick={() => navigate("/planner")} className="empty-btn">
              Create Trip
            </button>
          </div>
        ) : (
          <div className="itineraries-grid">
            {itineraries.map((it, index) => (
              <div key={it._id} className="itinerary-card">
                <div className="card-index">#{index + 1}</div>
                
                <div className="itinerary-card-top">
                  <span className="itinerary-destination">{capitalizeFirstLetter(it.destination)}</span>
                  <span className="itinerary-days">{getDayCount(it.startdate, it.enddate)}</span>
                </div>

                <div className="itinerary-card-dates">
                  <span>{it.startdate}</span>
                  <span className="date-separator">/</span>
                  <span>{it.enddate}</span>
                </div>

                <div className="itinerary-card-meta">
                  {it.flightdetails && <span className="meta-tag">Flight Booked</span>}
                  {it.hoteldetails && <span className="meta-tag">Hotel Booked</span>}
                  {it.events?.length > 0 && <span className="meta-tag">{it.events.length} Event{it.events.length > 1 ? "s" : ""}</span>}
                  {!it.flightdetails && !it.hoteldetails && (!it.events || it.events.length === 0) && (
                    <span className="meta-tag incomplete">Incomplete</span>
                  )}
                </div>

                <button className="open-btn" onClick={() => navigate(`/itinerary/${it._id}`)}>
                  View Itinerary
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
