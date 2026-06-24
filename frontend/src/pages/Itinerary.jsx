import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Itinerary.css";

export default function Itinerary() {
  const location = useLocation();
  const navigate = useNavigate();
  const trip = location.state?.trip;
  const orchestratorResults = location.state?.orchestratorResults || {};
  const currentBg = location.state?.currentBg || sessionStorage.getItem('currentBg') || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80';

  const agents = [
    { id: 1, label: "Events", desc: "Discover local events & festivals", icon: "E" },
    { id: 2, label: "Hotels", desc: "Find the best places to stay", icon: "H" },
    { id: 3, label: "Route", desc: "Get directions & distance", icon: "R" },
    { id: 4, label: "Weather", desc: "Check forecast for trip dates", icon: "W" },
    { id: 5, label: "Flights", desc: "Search departure & return flights", icon: "F" }
  ];

  const handleClick = (card) => {
    if (!trip) return;
    switch (card.label) {
      case "Route":
        navigate("/route", { state: { start: trip.startDestination, end: trip.destination, initialData: orchestratorResults.route } });
        break;
      case "Flights":
        navigate("/flights", { state: { trip, initialData: orchestratorResults.flights } });
        break;
      case "Weather":
        navigate("/weather", { state: { trip, initialData: orchestratorResults.weather } });
        break;
      case "Events":
        navigate(`/events?tripId=${trip.id}`, { state: { trip, initialData: orchestratorResults.events } });
        break;
      case "Hotels":
        navigate("/hotels", { state: { trip, initialData: orchestratorResults.hotels } });
        break;
      default:
        break;
    }
  };

  const isComplete = trip && trip.id && trip.destination && trip.start && trip.end;

  return (
    <div className="itn-page">
      <div className="itn-bg" style={{ backgroundImage: `url(${currentBg})` }} />
      
      <div className="itn-content">
        {/* Trip Info Header */}
        <div className="itn-hero">
          <span className="itn-label">YOUR TRIP</span>
          <h1 className="itn-destination">{trip?.destination || "—"}</h1>
          <p className="itn-dates">
            {trip?.startDestination} to {trip?.destination} | {trip?.start} — {trip?.end}
          </p>
        </div>

        {/* Agent Cards */}
        <div className="itn-agents-grid">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="itn-agent-card"
              onClick={() => handleClick(agent)}
            >
              <div className="agent-icon-circle">{agent.icon}</div>
              <div className="agent-text">
                <h3>{agent.label}</h3>
                <p>{agent.desc}</p>
              </div>
              <span className="agent-arrow">&rarr;</span>
            </div>
          ))}
        </div>

        {/* View Final Itinerary */}
        {isComplete && (
          <button
            className="itn-final-btn"
            onClick={() => navigate(`/itinerary/${trip.id}`)}
          >
            View Final Itinerary
          </button>
        )}
      </div>
    </div>
  );
}
