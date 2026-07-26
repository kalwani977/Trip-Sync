import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import "../styles/ItineraryCard.css";
import AiDayCard from "../components/itinerary/AiDayCard";

export default function ItineraryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [weather, setWeather] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [bgImage, setBgImage] = useState("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80");
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [regeneratingDay, setRegeneratingDay] = useState(null);
  const [hasEdits, setHasEdits] = useState(false);

  // Retrieve user preferences from sessionStorage (set by TripPlanner → Itinerary flow)
  const getPreferences = () => {
    try {
      const stored = sessionStorage.getItem('tripPreferences');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  };

  useEffect(() => {
    fetchItinerary();
  }, [id]);

  const fetchItinerary = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/itinerary/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
      if (res.data.destination) {
        fetchWeather(res.data.destination);
        fetchBg(res.data.destination);
      }
    } catch (err) {
      setError("Failed to load itinerary details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (city) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/weather?city=${city}`);
      setWeather(res.data.list || []);
    } catch (err) {
      console.error("Weather fetch failed");
    }
  };

  const fetchBg = async (dest) => {
    try {
      const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
      if (!accessKey) return;
      const res = await axios.get(`https://api.unsplash.com/search/photos?query=${dest}&orientation=landscape&per_page=1&client_id=${accessKey}`);
      if (res.data && res.data.results.length > 0) {
        setBgImage(res.data.results[0].urls.regular);
      }
    } catch (e) {
      // ignore
    }
  };

  const generateAiPlan = async () => {
    if (!data) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/generate-itinerary`,
        {
          destination: data.destination,
          startDate: data.startdate,
          endDate: data.enddate,
          flights: data.flightdetails ? [data.flightdetails, data.returnflight] : [],
          hotels: data.hoteldetails ? [data.hoteldetails] : [],
          events: data.events || [],
          weather: weather,
          preferences: getPreferences()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setAiPlan(res.data.plan);
        setHasEdits(false);
      }
    } catch (err) {
      console.error("AI Generation failed", err);
      toast.error("Failed to generate AI plan. Check your GROQ_API_KEY.");
    } finally {
      setAiLoading(false);
    }
  };

  // ===== AI Plan Mutation Functions =====

  const handleEditActivity = (dayNum, actIdx, updatedActivity) => {
    setAiPlan(prev => prev.map(day => {
      if (day.day !== dayNum) return day;
      const newActivities = [...day.activities];
      newActivities[actIdx] = updatedActivity;
      return { ...day, activities: newActivities };
    }));
    setHasEdits(true);
    toast.success("Activity updated");
  };

  const handleDeleteActivity = (dayNum, actIdx) => {
    setAiPlan(prev => prev.map(day => {
      if (day.day !== dayNum) return day;
      const newActivities = day.activities.filter((_, i) => i !== actIdx);
      return { ...day, activities: newActivities };
    }));
    setHasEdits(true);
    toast.success("Activity removed");
  };

  const handleAddActivity = (dayNum, newActivity) => {
    setAiPlan(prev => prev.map(day => {
      if (day.day !== dayNum) return day;
      return { ...day, activities: [...day.activities, newActivity] };
    }));
    setHasEdits(true);
    toast.success("Activity added");
  };

  const handleMoveActivity = (dayNum, actIdx, direction) => {
    setAiPlan(prev => prev.map(day => {
      if (day.day !== dayNum) return day;
      const newActivities = [...day.activities];
      const targetIdx = direction === "up" ? actIdx - 1 : actIdx + 1;
      if (targetIdx < 0 || targetIdx >= newActivities.length) return day;
      [newActivities[actIdx], newActivities[targetIdx]] = [newActivities[targetIdx], newActivities[actIdx]];
      return { ...day, activities: newActivities };
    }));
    setHasEdits(true);
  };

  const handleEditDayTitle = (dayNum, newTitle) => {
    setAiPlan(prev => prev.map(day => {
      if (day.day !== dayNum) return day;
      return { ...day, title: newTitle };
    }));
    setHasEdits(true);
    toast.success("Day title updated");
  };

  const handleRegenerateDay = async (dayNum, dayDate) => {
    if (!data) return;
    setRegeneratingDay(dayNum);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/regenerate-day`,
        {
          destination: data.destination,
          startDate: data.startdate,
          endDate: data.enddate,
          dayNumber: dayNum,
          dayDate: dayDate,
          existingPlan: aiPlan,
          preferences: getPreferences()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.dayPlan) {
        setAiPlan(prev => prev.map(day => 
          day.day === dayNum ? { ...res.data.dayPlan, day: dayNum } : day
        ));
        setHasEdits(true);
        toast.success(`Day ${dayNum} regenerated!`);
      }
    } catch (err) {
      console.error("Regenerate day failed", err);
      toast.error("Failed to regenerate day. Try again.");
    } finally {
      setRegeneratingDay(null);
    }
  };

  // ===== End Mutation Functions =====

  const handleRemoveItem = async (itemType) => {
    if (!window.confirm(`Are you sure you want to remove your ${itemType}?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${import.meta.env.VITE_API_URL}/api/itinerary/remove-item`, {
        itineraryId: id,
        itemType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(prev => ({
        ...prev,
        [itemType === 'flight' ? 'flightdetails' : 'hoteldetails']: null,
        ...(itemType === 'flight' ? { returnflight: null } : {})
      }));
      toast.success(`${itemType} removed successfully`);
    } catch (err) {
      toast.error(`Failed to remove ${itemType}`);
    }
  };

  const handleChangeItem = (itemType) => {
    navigate(`/${itemType}s`, {
      state: {
        trip: { id, destination: data.destination, start: data.startdate, end: data.enddate }
      }
    });
  };

  const generateDates = (start, end) => {
    if (!start || !end) return [];
    const dates = [];
    let curr = new Date(start);
    const stop = new Date(end);
    while (curr <= stop) {
      dates.push(curr.toISOString().split("T")[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const getWeatherForDate = (dateStr) => {
    const dayForecasts = weather.filter(w => w.dt_txt.startsWith(dateStr));
    if (!dayForecasts.length) return null;
    return dayForecasts.reduce((prev, curr) => {
      const prevHour = parseInt(prev.dt_txt.split(" ")[1]);
      const currHour = parseInt(curr.dt_txt.split(" ")[1]);
      return Math.abs(currHour - 12) < Math.abs(prevHour - 12) ? curr : prev;
    });
  };

  const calculateBudget = () => {
    if (!data) return null;
    const goingFlight = data.flightdetails?.price || 0;
    const returnFlight = data.returnflight?.price || 0;
    let hotelPerNight = 0;
    if (data.hoteldetails?.price && data.hoteldetails.price !== "N/A") {
      hotelPerNight = parseInt(data.hoteldetails.price.replace(/[₹,]/g, "")) || 0;
    }
    const nights = generateDates(data.startdate, data.enddate).length - 1;
    const hotelTotal = hotelPerNight * Math.max(nights, 1);
    const total = goingFlight + returnFlight + hotelTotal;
    return { goingFlight, returnFlight, hotelPerNight, hotelTotal, nights, total };
  };

  const getDayActivity = (dateStr, dayIndex, totalDays) => {
    if (dayIndex === 0) return "Arrival — Check into your stay & settle in.";
    if (dayIndex === totalDays - 1) return "Departure — Safe travels back home!";
    return "Explore the city, relax, or check out local hotspots.";
  };

  const capitalizeFirstLetter = (str) => {
    if (!str) return "";
    return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  };

  if (loading) return <div className="icard-page"><div className="icard-loading">Loading Trip...</div></div>;
  if (error) return <div className="icard-page"><div className="icard-loading">{error}</div></div>;

  const tripDates = generateDates(data.startdate, data.enddate);
  const budget = calculateBudget();

  return (
    <div className="icard-page">
      <div className="icard-bg" style={{ backgroundImage: `url(${bgImage})` }} />
      
      <div className="icard-dashboard">
        {/* Left Sidebar (Sticky Bento Box) */}
        <aside className="icard-sidebar">
          <div className="bento-widget hero-widget">
            <h1 className="hero-dest">{capitalizeFirstLetter(data.destination)}</h1>
            <p className="hero-dates">{data.startdate} — {data.enddate}</p>
            <span className="hero-badge">{tripDates.length} Days</span>
          </div>

          <div className="bento-widget">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '15px' }}>
                <h3 className="widget-title" style={{ border: 'none', margin: 0, padding: 0 }}>Flights</h3>
                {data.flightdetails || data.returnflight ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleChangeItem('flight')} style={{ background: 'transparent', color: '#ccc', border: '1px solid #555', borderRadius: '4px', fontSize: '0.7rem', padding: '2px 8px', cursor: 'pointer' }}>Change</button>
                    <button onClick={() => handleRemoveItem('flight')} style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '4px', fontSize: '0.7rem', padding: '2px 8px', cursor: 'pointer' }}>Remove</button>
                  </div>
                ) : (
                  <button onClick={() => handleChangeItem('flight')} style={{ background: '#7b2cbf', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', padding: '4px 12px', cursor: 'pointer' }}>+ Add</button>
                )}
              </div>
              {data.flightdetails && (
                <div className="mini-flight">
                  <span className="mini-label">OUTBOUND</span>
                  <div className="mini-route">
                    <span>{data.flightdetails.departure_airport}</span>
                    <span className="mini-arrow">→</span>
                    <span>{data.flightdetails.arrival_airport}</span>
                  </div>
                  <div className="mini-meta">
                    {data.flightdetails.airline} • {data.flightdetails.flight_number}
                  </div>
                </div>
              )}
              {data.returnflight && (
                <div className="mini-flight mt-12">
                  <span className="mini-label">RETURN</span>
                  <div className="mini-route">
                    <span>{data.returnflight.departure_airport}</span>
                    <span className="mini-arrow">→</span>
                    <span>{data.returnflight.arrival_airport}</span>
                  </div>
                  <div className="mini-meta">
                    {data.returnflight.airline} • {data.returnflight.flight_number}
                  </div>
                </div>
              )}
              {!data.flightdetails && !data.returnflight && (
                <p style={{ color: "#888", fontSize: "0.85rem", textAlign: "center", margin: "10px 0" }}>No flights booked yet.</p>
              )}
            </div>

            <div className="bento-widget hotel-widget">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '15px' }}>
                <h3 className="widget-title" style={{ border: 'none', margin: 0, padding: 0 }}>Stay</h3>
                {data.hoteldetails ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleChangeItem('hotel')} style={{ background: 'transparent', color: '#ccc', border: '1px solid #555', borderRadius: '4px', fontSize: '0.7rem', padding: '2px 8px', cursor: 'pointer' }}>Change</button>
                    <button onClick={() => handleRemoveItem('hotel')} style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '4px', fontSize: '0.7rem', padding: '2px 8px', cursor: 'pointer' }}>Remove</button>
                  </div>
                ) : (
                  <button onClick={() => handleChangeItem('hotel')} style={{ background: '#7b2cbf', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', padding: '4px 12px', cursor: 'pointer' }}>+ Add</button>
                )}
              </div>
              {data.hoteldetails ? (
                <div className="mini-hotel">
                  <img src={data.hoteldetails.thumbnail} alt="" className="mini-hotel-img" />
                  <div className="mini-hotel-info">
                    <h4>{data.hoteldetails.name}</h4>
                    <span className="mini-rating">{data.hoteldetails.rating} / 5</span>
                    <a href={data.hoteldetails.link} target="_blank" rel="noreferrer" className="mini-link">View Details</a>
                  </div>
                </div>
              ) : (
                <p style={{ color: "#888", fontSize: "0.85rem", textAlign: "center", margin: "10px 0" }}>No hotel booked yet.</p>
              )}
            </div>

          {budget && (
            <div className="bento-widget budget-widget">
              <h3 className="widget-title">Budget Estimate</h3>
              <div className="mini-budget-row">
                <span>Flights</span>
                <span>Rs {(budget.goingFlight + budget.returnFlight).toLocaleString()}</span>
              </div>
              <div className="mini-budget-row">
                <span>Hotel</span>
                <span>Rs {budget.hotelTotal.toLocaleString()}</span>
              </div>
              <div className="mini-budget-divider"></div>
              <div className="mini-budget-total">
                <span>Total</span>
                <span>Rs {budget.total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </aside>

        {/* Right Main Content (Vertical Timeline) */}
        <main className="icard-main">
          <div className="timeline-header-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "12px" }}>
            <h2 className="timeline-header" style={{ margin: 0 }}>Your Journey</h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              {aiPlan && hasEdits && (
                <span style={{
                  color: "rgba(199, 125, 255, 0.8)",
                  fontSize: "0.78rem",
                  fontStyle: "italic"
                }}>
                  Unsaved edits
                </span>
              )}
              {aiPlan && (
                <button 
                  onClick={() => { setAiPlan(null); setHasEdits(false); }}
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "rgba(255, 255, 255, 0.65)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    padding: "0.6rem 1.2rem",
                    borderRadius: "30px",
                    fontWeight: "500",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    transition: "all 0.2s"
                  }}
                >
                  Reset to Default
                </button>
              )}
              <button 
                onClick={generateAiPlan} 
                disabled={aiLoading}
                style={{
                  background: "linear-gradient(135deg, #7b2cbf, #c77dff)",
                  color: "white",
                  border: "none",
                  padding: "0.7rem 1.4rem",
                  borderRadius: "30px",
                  fontWeight: "bold",
                  cursor: aiLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 15px rgba(123, 44, 191, 0.3)",
                  transition: "transform 0.2s",
                  fontSize: "0.85rem"
                }}
              >
                {aiLoading ? "Generating..." : aiPlan ? "Regenerate Full Plan" : "Generate AI Plan"}
              </button>
            </div>
          </div>
          
          <div className="timeline">
            {aiPlan ? (
              aiPlan.map((dayPlan, idx) => (
                <AiDayCard 
                  key={`${dayPlan.day}-${idx}`} 
                  dayPlan={dayPlan} 
                  weatherData={getWeatherForDate(dayPlan.date)} 
                  onEditActivity={handleEditActivity}
                  onDeleteActivity={handleDeleteActivity}
                  onAddActivity={handleAddActivity}
                  onMoveActivity={handleMoveActivity}
                  onEditDayTitle={handleEditDayTitle}
                  onRegenerateDay={handleRegenerateDay}
                  isRegenerating={regeneratingDay === dayPlan.day}
                />
              ))
            ) : (
              tripDates.map((dateStr, index) => {
                const weatherData = getWeatherForDate(dateStr);
              
              // Distribute 'Ongoing' Foursquare events across days evenly
              const dayEvents = (data.events || []).filter((e, idx) => {
                if (e.date === dateStr) return true;
                if (e.date === "Ongoing") {
                  if (tripDates.length <= 2) return idx % tripDates.length === index;
                  const middleDays = Math.max(1, tripDates.length - 2);
                  const targetDay = index > 0 && index < tripDates.length - 1 ? ((index - 1) % middleDays) : -1;
                  return targetDay !== -1 && (idx % middleDays === targetDay);
                }
                return false;
              });
              
              return (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker">
                    <div className="timeline-dot"></div>
                    {index < tripDates.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  
                  <div className="timeline-content bento-widget">
                    <div className="day-header">
                      <div className="day-info">
                        <h3>Day {index + 1}</h3>
                        <span className="day-date">{dateStr}</span>
                      </div>
                      {weatherData && (
                        <div className="day-weather">
                          <span>{Math.round(weatherData.main.temp)}°C</span>
                          <img src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`} alt="" />
                        </div>
                      )}
                    </div>
                    
                    <p className="day-activity">{getDayActivity(dateStr, index, tripDates.length)}</p>

                    {dayEvents.length > 0 && (
                      <div className="day-events">
                        {dayEvents.map((ev, i) => (
                          <div key={i} className="timeline-event" title={ev.title}>
                            <img src={ev.image} alt="" className="te-img" />
                            <div className="te-info">
                              <h4>{ev.title}</h4>
                              <span>{ev.time} • {ev.venue}</span>
                            </div>
                            {ev.ticket_link && <a href={ev.ticket_link} target="_blank" rel="noreferrer" className="te-link">Tickets</a>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </main>

      </div>
    </div>
  );
}
