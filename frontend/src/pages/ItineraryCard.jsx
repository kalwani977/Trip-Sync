import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Nav from "../components/Nav";
import "../styles/ItineraryCard.css";

export default function ItineraryDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [weather, setWeather] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    if (dayIndex === 0) return "Arrival — Check into hotel, rest & explore nearby";
    if (dayIndex === totalDays - 1) return "Departure — Check out & head to airport";
    const dayEvents = (data.events || []).filter(e => e.date === dateStr);
    if (dayEvents.length > 0) {
      return dayEvents.map(e => `${e.title} at ${e.venue || "TBA"}`).join(" | ");
    }
    return "Free Day — Sightseeing & local exploration";
  };

  if (loading) return <div className="icard-page"><Nav /><div className="icard-loading">Loading Trip...</div></div>;
  if (error) return <div className="icard-page"><Nav /><div className="icard-loading">{error}</div></div>;

  const tripDates = generateDates(data.startdate, data.enddate);
  const budget = calculateBudget();

  return (
    <div className="icard-page">
      <Nav />

      <div className="icard-content">
        {/* Header */}
        <div className="icard-hero">
          <h1 className="icard-title">{data.destination}</h1>
          <p className="icard-dates">{data.startdate} — {data.enddate}</p>
          <span className="icard-badge">{tripDates.length} Day Trip</span>
        </div>

        {/* Flights Section */}
        {(data.flightdetails || data.returnflight) && (
          <section className="icard-section">
            <h2 className="icard-section-title">Flights</h2>
            <div className="flights-row">
              {data.flightdetails && (
                <div className="flight-box">
                  <span className="flight-label">DEPARTURE</span>
                  <div className="flight-main">
                    <img src={data.flightdetails.airline_logo} alt="" className="flight-logo" />
                    <div className="flight-details">
                      <h4>{data.flightdetails.airline}</h4>
                      <p className="flight-number">{data.flightdetails.flight_number}</p>
                    </div>
                    <div className="flight-price">Rs {data.flightdetails.price}</div>
                  </div>
                  <div className="flight-route">
                    <div className="route-point">
                      <span className="route-time">{data.flightdetails.departure_time}</span>
                      <span className="route-airport">{data.flightdetails.departure_airport}</span>
                    </div>
                    <div className="route-line">
                      <div className="route-dot"></div>
                      <div className="route-dash"></div>
                      <div className="route-dot"></div>
                    </div>
                    <div className="route-point end">
                      <span className="route-time">{data.flightdetails.arrival_time}</span>
                      <span className="route-airport">{data.flightdetails.arrival_airport}</span>
                    </div>
                  </div>
                  <span className="flight-duration">{data.flightdetails.duration} mins</span>
                </div>
              )}

              {data.returnflight && (
                <div className="flight-box">
                  <span className="flight-label">RETURN</span>
                  <div className="flight-main">
                    <img src={data.returnflight.airline_logo} alt="" className="flight-logo" />
                    <div className="flight-details">
                      <h4>{data.returnflight.airline}</h4>
                      <p className="flight-number">{data.returnflight.flight_number}</p>
                    </div>
                    <div className="flight-price">Rs {data.returnflight.price}</div>
                  </div>
                  <div className="flight-route">
                    <div className="route-point">
                      <span className="route-time">{data.returnflight.departure_time}</span>
                      <span className="route-airport">{data.returnflight.departure_airport}</span>
                    </div>
                    <div className="route-line">
                      <div className="route-dot"></div>
                      <div className="route-dash"></div>
                      <div className="route-dot"></div>
                    </div>
                    <div className="route-point end">
                      <span className="route-time">{data.returnflight.arrival_time}</span>
                      <span className="route-airport">{data.returnflight.arrival_airport}</span>
                    </div>
                  </div>
                  <span className="flight-duration">{data.returnflight.duration} mins</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Hotel Section */}
        {data.hoteldetails && (
          <section className="icard-section">
            <h2 className="icard-section-title">Accommodation</h2>
            <div className="hotel-box">
              <img src={data.hoteldetails.thumbnail} alt="" className="hotel-img" />
              <div className="hotel-info">
                <h3>{data.hoteldetails.name}</h3>
                <div className="hotel-stats">
                  <span className="hotel-rating">Rating: {data.hoteldetails.rating} / 5</span>
                  <span className="hotel-reviews">{data.hoteldetails.reviews} reviews</span>
                </div>
                <p className="hotel-desc">{data.hoteldetails.description}</p>
                <a href={data.hoteldetails.link} target="_blank" rel="noreferrer" className="hotel-link">
                  View Details
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Day-wise Itinerary */}
        <section className="icard-section">
          <h2 className="icard-section-title">Day-wise Plan</h2>
          <div className="daywise-list">
            {tripDates.map((dateStr, index) => {
              const weatherData = getWeatherForDate(dateStr);
              return (
                <div key={index} className="day-row">
                  <div className="day-left">
                    <span className="day-num">Day {index + 1}</span>
                    <span className="day-date">{dateStr}</span>
                  </div>
                  <div className="day-middle">
                    <p>{getDayActivity(dateStr, index, tripDates.length)}</p>
                  </div>
                  <div className="day-right">
                    {weatherData ? (
                      <>
                        <img
                          src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`}
                          alt=""
                          className="day-weather-icon"
                        />
                        <span>{Math.round(weatherData.main.temp)}°C</span>
                      </>
                    ) : (
                      <span className="no-weather">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Budget Breakdown */}
        {budget && (
          <section className="icard-section">
            <h2 className="icard-section-title">Budget Breakdown</h2>
            <div className="budget-box">
              <div className="budget-row">
                <span>Departure Flight</span>
                <span>Rs {budget.goingFlight.toLocaleString()}</span>
              </div>
              <div className="budget-row">
                <span>Return Flight</span>
                <span>Rs {budget.returnFlight.toLocaleString()}</span>
              </div>
              <div className="budget-row">
                <span>Hotel ({budget.nights} nights x Rs {budget.hotelPerNight.toLocaleString()})</span>
                <span>Rs {budget.hotelTotal.toLocaleString()}</span>
              </div>
              <div className="budget-divider"></div>
              <div className="budget-row total">
                <span>Estimated Total</span>
                <span>Rs {budget.total.toLocaleString()}</span>
              </div>
            </div>
          </section>
        )}

        {/* Events */}
        {data.events && data.events.length > 0 && (
          <section className="icard-section">
            <h2 className="icard-section-title">Planned Events</h2>
            <div className="events-list">
              {data.events.map((event, index) => (
                <div key={index} className="event-row">
                  <img src={event.image} alt="" className="event-thumb" />
                  <div className="event-info">
                    <h4>{event.title}</h4>
                    <p className="event-meta">{event.date} | {event.time}</p>
                    <p className="event-venue">{event.venue}</p>
                  </div>
                  {event.ticket_link && (
                    <a href={event.ticket_link} target="_blank" rel="noreferrer" className="event-link">
                      Tickets
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
