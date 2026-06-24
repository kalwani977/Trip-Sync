import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/Weather.css";

export default function Weather() {
  const location = useLocation();
  const trip = location.state?.trip;

  const city = trip?.destination;
  const startDate = trip?.start;
  const endDate = trip?.end;

  const initialData = location.state?.initialData;
  const [forecast, setForecast] = useState(initialData?.list || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper to generate dates locally since we aren't updating TripPlanner
  const generateDates = (s, e) => {
    if (!s || !e) return [];
    const dates = [];
    let curr = new Date(s);
    const stop = new Date(e);
    while (curr <= stop) {
      dates.push(curr.toISOString().split("T")[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const tripDates = generateDates(startDate, endDate);

  useEffect(() => {
    if (city && (!initialData || !initialData.list)) fetchForecast();
  }, [city, initialData]);

  const fetchForecast = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/weather?city=${city}`
      );
      if (!res.ok) throw new Error("Weather data not found");
      const data = await res.json();
      setForecast(data.list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const forecastByDate = forecast.reduce((acc, item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const getMiddayForecast = (dayForecast) => {
    if (!dayForecast) return null;
    return dayForecast.reduce((prev, curr) => {
      const prevHour = parseInt(prev.dt_txt.split(" ")[1].split(":")[0]);
      const currHour = parseInt(curr.dt_txt.split(" ")[1].split(":")[0]);
      return Math.abs(currHour - 12) < Math.abs(prevHour - 12) ? curr : prev;
    });
  };

  return (
    <div className="background-containerr">
            <div className="background-content">
        <header className="events-header">
          <h2 className="section-title">Weather in {city}</h2>
          <p className="events-subtitle">{startDate} — {endDate}</p>
        </header>

        <main className="travel-section">
          {loading && <p className="status-msg">Fetching live forecast...</p>}
          {error && <p className="status-msg error">{error}</p>}

          <div className="travel-grid">
            {tripDates.map((dateStr, index) => {
              const dayForecast = forecastByDate[dateStr];
              const midday = getMiddayForecast(dayForecast);

              return (
                <div key={index} className="travel-card weather-card-flex">
                  <div className="card-details">
                    <p className="card-category">DAY {index + 1}</p>
                    <h4 className="card-location">{dateStr}</h4>
                    
                    {midday ? (
                      <div className="weather-info-body">
                        <div className="weather-main">
                          <img 
                            src={`https://openweathermap.org/img/wn/${midday.weather[0].icon}@2x.png`} 
                            alt="icon" 
                            className="weather-icon-large"
                          />
                          <span className="weather-temp-big">{Math.round(midday.main.temp)}°C</span>
                        </div>
                        <p className="card-desc weather-desc-text">
                          {midday.weather[0].description}
                        </p>
                        <div className="weather-stats-grid">
                          <div className="w-stat">Humidity: {midday.main.humidity}%</div>
                          <div className="w-stat">Wind: {midday.wind.speed}m/s</div>
                        </div>
                      </div>
                    ) : (
                      <div className="weather-unavailable">
                        <p className="card-desc">Forecast unavailable for this date.</p>
                        <p className="small-note">(API only provides 5-day lookahead)</p>
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