import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/ItineraryCard.css";

export default function ItineraryDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [weather, setWeather] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [bgImage, setBgImage] = useState("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80");

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

          {(data.flightdetails || data.returnflight) && (
            <div className="bento-widget">
              <h3 className="widget-title">Flights</h3>
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
            </div>
          )}

          {data.hoteldetails && (
            <div className="bento-widget hotel-widget">
              <h3 className="widget-title">Stay</h3>
              <div className="mini-hotel">
                <img src={data.hoteldetails.thumbnail} alt="" className="mini-hotel-img" />
                <div className="mini-hotel-info">
                  <h4>{data.hoteldetails.name}</h4>
                  <span className="mini-rating">{data.hoteldetails.rating} / 5</span>
                  <a href={data.hoteldetails.link} target="_blank" rel="noreferrer" className="mini-link">View Details</a>
                </div>
              </div>
            </div>
          )}

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
          <h2 className="timeline-header">Your Journey</h2>
          
          <div className="timeline">
            {tripDates.map((dateStr, index) => {
              const weatherData = getWeatherForDate(dateStr);
              const dayEvents = (data.events || []).filter(e => e.date === dateStr);
              
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
            })}
          </div>
        </main>

      </div>
    </div>
  );
}
