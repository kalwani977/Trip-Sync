import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Nav from "../components/Nav";
import "../styles/Route.css";
import "leaflet/dist/leaflet.css";

export default function RouteFinder() {
  const location = useLocation();
  const { start, end } = location.state || {};

  const [mode, setMode] = useState("driving-car");
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (start && end) fetchRoute();
  }, [mode]);

  const fetchRoute = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/map`, {
        startCity: start,
        endCity: end,
        mode,
      });
      const feature = res.data.route.features[0];
      const coords = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const summary = feature.properties.summary;
      setRouteCoords(coords);
      setDistance((summary.distance / 1000).toFixed(1) + " km");
      setDuration((summary.duration / 60).toFixed(0) + " mins");
    } catch (err) {
      console.error(err);
      setError("Failed to load route");
    } finally {
      setLoading(false);
    }
  };

  const modeLabels = {
    "driving-car": "Driving",
    "cycling-regular": "Cycling",
    "foot-walking": "Walking"
  };

  return (
    <div className="route-page-wrapper">
      <Nav />
      <div className="route-content">
        {/* Header */}
        <div className="route-hero">
          <span className="route-label">ROUTE</span>
          <h1 className="route-title">{start} to {end}</h1>
        </div>

        {/* Main Layout */}
        <div className="route-layout">
          {/* Map */}
          <div className="route-map-container">
            <MapContainer
              center={routeCoords.length ? routeCoords[0] : [28.6139, 77.2090]}
              zoom={6}
              className="route-map"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {routeCoords.length > 0 && (
                <>
                  <Marker position={routeCoords[0]} />
                  <Marker position={routeCoords[routeCoords.length - 1]} />
                  <Polyline positions={routeCoords} color="#9a5db8" weight={4} />
                </>
              )}
            </MapContainer>
          </div>

          {/* Info Panel */}
          <div className="route-info-panel">
            <div className="route-info-card">
              <h3>Trip Details</h3>
              <div className="route-detail-row">
                <span className="detail-label">From</span>
                <span className="detail-value">{start}</span>
              </div>
              <div className="route-detail-row">
                <span className="detail-label">To</span>
                <span className="detail-value">{end}</span>
              </div>

              {distance && (
                <>
                  <div className="route-detail-row">
                    <span className="detail-label">Distance</span>
                    <span className="detail-value highlight">{distance}</span>
                  </div>
                  <div className="route-detail-row">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value highlight">{duration}</span>
                  </div>
                </>
              )}
            </div>

            {/* Mode Selector */}
            <div className="route-mode-card">
              <h3>Travel Mode</h3>
              <div className="mode-buttons">
                {Object.entries(modeLabels).map(([key, label]) => (
                  <button
                    key={key}
                    className={`mode-btn ${mode === key ? "active" : ""}`}
                    onClick={() => setMode(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading && <p className="route-status">Calculating route...</p>}
            {error && <p className="route-status error">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
