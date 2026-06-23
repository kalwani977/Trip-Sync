import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Nav from "../components/Nav";
import "../styles/TripPlanner.css";

function daysBetween(startStr, endStr) {
  const s = new Date(startStr);
  const e = new Date(endStr);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

export default function TripPlanner() {
  const navigate = useNavigate();

  const [startDestination, setStartDestination] = useState("");
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Agent status tracking
  const [agentStatus, setAgentStatus] = useState({
    weather: "pending",
    route: "pending",
    flights: "pending",
    hotels: "pending",
    events: "pending"
  });
  const [showAgents, setShowAgents] = useState(false);

  const updateAgent = (agent, status) => {
    setAgentStatus(prev => ({ ...prev, [agent]: status }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");

    if (!startDestination || !destination || !start || !end) {
      setError("Please fill all required fields.");
      return;
    }

    if (daysBetween(start, end) <= 0) {
      setError("End date must be after start date.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login first.");
      return;
    }

    try {
      setLoading(true);
      setShowAgents(true);

      // Reset agent statuses
      setAgentStatus({
        weather: "working",
        route: "working",
        flights: "working",
        hotels: "working",
        events: "working"
      });

      // 1. Create itinerary in backend
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/itinerary/create`,
        { destination, startdate: start, enddate: end },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const itineraryId = res.data.itineraryId;

      // 2. Run all agents in parallel
      const agentPromises = [
        // Weather Agent
        axios.get(`${import.meta.env.VITE_API_URL}/api/weather?city=${destination}`)
          .then(res => {
            updateAgent("weather", "done");
            return { type: 'weather', data: res.data };
          })
          .catch(() => updateAgent("weather", "failed")),

        // Route Agent
        axios.post(`${import.meta.env.VITE_API_URL}/api/map`, {
          startCity: startDestination,
          endCity: destination,
          mode: "driving-car"
        })
          .then(res => {
            updateAgent("route", "done");
            return { type: 'route', data: res.data };
          })
          .catch(() => updateAgent("route", "failed")),

        // Flights Agent
        axios.get(`${import.meta.env.VITE_API_URL}/api/flights`, {
          params: { from: startDestination, to: destination, out_date: start }
        })
          .then(res => {
            updateAgent("flights", "done");
            return { type: 'flights', data: res.data };
          })
          .catch(() => updateAgent("flights", "failed")),

        // Hotels Agent
        axios.get(`${import.meta.env.VITE_API_URL}/api/hotels`, {
          params: { city: destination, check_in: start, check_out: end }
        })
          .then(res => {
            updateAgent("hotels", "done");
            return { type: 'hotels', data: res.data };
          })
          .catch(() => updateAgent("hotels", "failed")),

        // Events Agent
        axios.get(`${import.meta.env.VITE_API_URL}/api/events`, {
          params: { city: destination, start_date: start, end_date: end }
        })
          .then(res => {
            updateAgent("events", "done");
            return { type: 'events', data: res.data };
          })
          .catch(() => updateAgent("events", "failed")),
      ];

      // Wait for all agents (don't fail if one fails)
      const settled = await Promise.allSettled(agentPromises);
      
      const orchestratorResults = {};
      settled.forEach(result => {
        if (result.status === "fulfilled" && result.value) {
          orchestratorResults[result.value.type] = result.value.data;
        }
      });

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. Navigate to Itinerary page
      const trip = {
        id: itineraryId,
        startDestination,
        destination,
        start,
        end,
        budget: budget ? Number(budget) : null,
        createdAt: new Date().toISOString(),
      };

      navigate("/itinerary", { state: { trip, orchestratorResults } });

    } catch (err) {
      console.error(err);
      setError("Failed to create itinerary.");
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = (status) => {
    switch (status) {
      case "working": return "⏳";
      case "done": return "✅";
      case "failed": return "⚠️";
      default: return "⬜";
    }
  };

  return (
    <div className="background-container">
      <Nav />
      <div className="container">
        {!showAgents ? (
          <form className="form-wrapper" onSubmit={handleGenerate}>
            {error && <div className="form-error">{error}</div>}

            <div className="tile blue">
              <span className="tile-label">Start Destination</span>
              <input
                className="input"
                value={startDestination}
                onChange={(e) => setStartDestination(e.target.value)}
                placeholder="e.g. Mumbai"
              />
            </div>

            <div className="tile green">
              <span className="tile-label">Destination</span>
              <input
                className="input"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Paris"
              />
            </div>

            <div className="tile purple dates-tile">
              <span className="tile-label">Start Date</span>
              <input
                className="input"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>

            <div className="tile purple dates-tile">
              <span className="tile-label">End Date</span>
              <input
                className="input"
                type="date"
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>

            <div className="tile yellow">
              <span className="tile-label">Budget (₹)</span>
              <input
                className="input"
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="optional"
              />
            </div>

            <div className="actions">
              <button type="submit" className="button" disabled={loading}>
                {loading ? "Creating..." : "Generate Itinerary"}
              </button>
            </div>
          </form>
        ) : (
          <div className="agent-orchestration">
            <h2 className="orchestration-title">🤖 Agents Working...</h2>
            <p className="orchestration-subtitle">
              Planning your trip to <strong>{destination}</strong>
            </p>
            <div className="agent-list">
              <div className={`agent-item ${agentStatus.weather}`}>
                <span className="agent-icon">{getAgentIcon(agentStatus.weather)}</span>
                <span className="agent-name">🌦️ Weather Agent</span>
                <span className="agent-desc">Fetching forecast for {destination}</span>
              </div>
              <div className={`agent-item ${agentStatus.route}`}>
                <span className="agent-icon">{getAgentIcon(agentStatus.route)}</span>
                <span className="agent-name">🗺️ Route Agent</span>
                <span className="agent-desc">Calculating {startDestination} → {destination}</span>
              </div>
              <div className={`agent-item ${agentStatus.flights}`}>
                <span className="agent-icon">{getAgentIcon(agentStatus.flights)}</span>
                <span className="agent-name">✈️ Flight Agent</span>
                <span className="agent-desc">Searching flights for {start}</span>
              </div>
              <div className={`agent-item ${agentStatus.hotels}`}>
                <span className="agent-icon">{getAgentIcon(agentStatus.hotels)}</span>
                <span className="agent-name">🏨 Hotel Agent</span>
                <span className="agent-desc">Finding stays in {destination}</span>
              </div>
              <div className={`agent-item ${agentStatus.events}`}>
                <span className="agent-icon">{getAgentIcon(agentStatus.events)}</span>
                <span className="agent-name">🎉 Events Agent</span>
                <span className="agent-desc">Discovering events in {destination}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
