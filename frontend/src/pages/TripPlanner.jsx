import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/TripPlanner.css";
import ItenaryBg from "../assets/Profile.jpeg";

function daysBetween(startStr, endStr) {
  const s = new Date(startStr);
  const e = new Date(endStr);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

const DEFAULT_BG = ItenaryBg;

export default function TripPlanner() {
  const navigate = useNavigate();

  const [startDestination, setStartDestination] = useState("");
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [userCity, setUserCity] = useState("");

  const handleNext = () => {
    if (step === 1 && !startDestination) { setError("Please tell us where you're starting from."); return; }
    if (step === 2 && !destination) { setError("Please enter a destination."); return; }
    if (step === 3 && (!start || !end)) { setError("Please select valid dates."); return; }
    setError("");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step < 4) handleNext();
      // Step 4 enter will be handled by form submit natively if focus is right, 
      // but let's handle it manually just in case
      if (step === 4 && !loading) {
        document.getElementById("wizard-form").requestSubmit();
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (step < 4) {
      handleNext();
    } else {
      handleGenerate(e);
    }
  };

  // Dynamic Background State
  const [bg1, setBg1] = useState(DEFAULT_BG);
  const [bg2, setBg2] = useState("");
  const [activeBg, setActiveBg] = useState(1);
  const activeBgRef = useRef(1);

  useEffect(() => {
    // Fetch user profile to get home city
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.user && res.data.user.city) {
          setUserCity(res.data.user.city);
        }
      } catch (err) {
        // Ignore if not logged in or no profile
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!destination.trim()) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
        if (!accessKey) return;
        
        const res = await axios.get(`https://api.unsplash.com/search/photos?query=${destination}&orientation=landscape&per_page=1&client_id=${accessKey}`);
        if (res.data && res.data.results.length > 0) {
          const newImageUrl = res.data.results[0].urls.regular;
          
          // Preload image
          const img = new Image();
          img.src = newImageUrl;
          img.onload = () => {
            if (activeBgRef.current === 1) {
              setBg2(newImageUrl);
              setActiveBg(2);
              activeBgRef.current = 2;
            } else {
              setBg1(newImageUrl);
              setActiveBg(1);
              activeBgRef.current = 1;
            }
          };
        }
      } catch (err) {
        console.error("Failed to fetch Unsplash image", err);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [destination]);

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

      const currentBg = activeBgRef.current === 1 ? bg1 : bg2;
      sessionStorage.setItem('currentBg', currentBg);
      navigate("/itinerary", { state: { trip, orchestratorResults, currentBg } });

    } catch (err) {
      console.error(err);
      setError("Failed to create itinerary.");
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = (status) => {
    switch (status) {
      case "working": return "↻";
      case "done": return "Done";
      case "failed": return "Err";
      default: return "-";
    }
  };

  return (
    <div className="background-container">
      <div className={`bg-layer ${activeBg === 1 ? 'active' : ''}`} style={{ backgroundImage: `url(${bg1})` }} />
      <div className={`bg-layer ${activeBg === 2 ? 'active' : ''}`} style={{ backgroundImage: `url(${bg2})` }} />
            <div className="container">
        {!showAgents ? (
          <form id="wizard-form" className="wizard-container" onSubmit={handleFormSubmit} onKeyDown={handleKeyDown}>
            {error && <div className="wizard-error">{error}</div>}
            
            {step === 1 && (
              <div className="wizard-step">
                <h1 className="wizard-question">Where are you starting your journey?</h1>
                <input autoFocus enterKeyHint="next" className="wizard-input" value={startDestination} onChange={(e) => setStartDestination(e.target.value)} placeholder="e.g. Mumbai" />
                {userCity && (
                  <button 
                    type="button" 
                    className="wizard-auto-fill-btn" 
                    onClick={() => {
                      setStartDestination(userCity);
                      // Auto-advance after small delay for better UX
                      setTimeout(() => {
                        setError("");
                        setStep(2);
                      }, 200);
                    }}
                  >
                    Use my profile city ({userCity})
                  </button>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="wizard-step">
                <h1 className="wizard-question">And where are we heading?</h1>
                <input autoFocus enterKeyHint="next" className="wizard-input" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Paris" />
              </div>
            )}

            {step === 3 && (
              <div className="wizard-step">
                <h1 className="wizard-question">When are you going?</h1>
                <div className="wizard-dates">
                  <input autoFocus enterKeyHint="next" className="wizard-input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                  <span className="wizard-dates-divider">to</span>
                  <input className="wizard-input" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="wizard-step">
                <h1 className="wizard-question">What's your total budget?</h1>
                <input autoFocus enterKeyHint="done" className="wizard-input" type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="₹ (Optional)" />
              </div>
            )}

            <div className="wizard-pagination">
              <button type="button" className="page-nav" onClick={handleBack} disabled={step === 1}>
                &lt;
              </button>
              
              <div className="page-numbers">
                <span className={step === 1 ? 'active' : ''}>1</span>
                <span className={step === 2 ? 'active' : ''}>2</span>
                <span className={step === 3 ? 'active' : ''}>3</span>
                <span className={step === 4 ? 'active' : ''}>4</span>
              </div>

              {step < 4 ? (
                <button type="button" className="page-nav" onClick={handleNext}>
                  &gt;
                </button>
              ) : (
                <button type="submit" className="page-generate" disabled={loading}>
                  {loading ? "..." : "Generate"}
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="agent-orchestration">
            <h2 className="orchestration-title">Agents Working...</h2>
            <p className="orchestration-subtitle">
              Planning your trip to <strong>{destination}</strong>
            </p>
            <div className="agent-list">
              <div className={`agent-item ${agentStatus.weather}`}>
                <span className="agent-icon">{getAgentIcon(agentStatus.weather)}</span>
                <span className="agent-name">Weather Agent</span>
                <span className="agent-desc">Fetching forecast for {destination}</span>
              </div>
              <div className={`agent-item ${agentStatus.route}`}>
                <span className="agent-icon">{getAgentIcon(agentStatus.route)}</span>
                <span className="agent-name">Route Agent</span>
                <span className="agent-desc">Calculating {startDestination} → {destination}</span>
              </div>
              <div className={`agent-item ${agentStatus.flights}`}>
                <span className="agent-icon">{getAgentIcon(agentStatus.flights)}</span>
                <span className="agent-name">Flight Agent</span>
                <span className="agent-desc">Searching flights for {start}</span>
              </div>
              <div className={`agent-item ${agentStatus.hotels}`}>
                <span className="agent-icon">{getAgentIcon(agentStatus.hotels)}</span>
                <span className="agent-name">Hotel Agent</span>
                <span className="agent-desc">Finding stays in {destination}</span>
              </div>
              <div className={`agent-item ${agentStatus.events}`}>
                <span className="agent-icon">{getAgentIcon(agentStatus.events)}</span>
                <span className="agent-name">Events Agent</span>
                <span className="agent-desc">Discovering events in {destination}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
