import React from "react";
import "./AiDayCard.css"; // We'll add some CSS later or inline it

export default function AiDayCard({ dayPlan, weatherData }) {
  return (
    <div className="timeline-item ai-timeline-item">
      <div className="timeline-marker">
        <div className="timeline-dot ai-dot"></div>
        <div className="timeline-line"></div>
      </div>
      
      <div className="timeline-content bento-widget ai-day-card">
        <div className="day-header ai-day-header">
          <div className="day-info">
            <h3>Day {dayPlan.day}: {dayPlan.title}</h3>
            <span className="day-date">{dayPlan.date}</span>
          </div>
          {weatherData && (
            <div className="day-weather">
              <span>{Math.round(weatherData.main.temp)}°C</span>
              <img src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`} alt="Weather icon" />
            </div>
          )}
        </div>
        
        <div className="ai-activities">
          {dayPlan.activities?.map((act, idx) => (
            <div key={idx} className="ai-activity">
              <div className="ai-act-time">{act.time}</div>
              <div className="ai-act-details">
                <h4>{act.title}</h4>
                <p>{act.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
