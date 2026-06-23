import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TripPlanner from "./pages/TripPlanner";
import Profile from "./pages/Profile";
import Itinerary from "./pages/Itinerary";
import Login from "./pages/Login";
import RouteFinder from "./pages/RouteFinder";
import FlightSearch from "./pages/FlightSearch";
import Weather from "./pages/Weather"; 
import Events from "./pages/Events"; 
import Hotels from "./pages/Hotels";
import ItineraryCard from "./pages/ItineraryCard";
import MyItineraries from "./pages/MyItineraries";
import Compare from "./pages/Compare";
import ChatbotWidget from "./components/Chatbot/ChatbotWidget";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <div>
      <Toaster position="top-center" />
      <ChatbotWidget />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/planner" element={<TripPlanner />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/login" element={<Login />} />
        <Route path="/route" element={<RouteFinder />} />
        <Route path="/flights" element={<FlightSearch />} /> 
        <Route path="/weather" element={<Weather />} /> 
        <Route path="/events" element={<Events />} /> 
        <Route path="/hotels" element={<Hotels />} /> 
        <Route path="/compare" element={<Compare />} />
        <Route path="/itinerary/:id" element={<ItineraryCard />} />
        <Route path="/my-itineraries" element={<MyItineraries />} />
      </Routes>
    </div>
  );
}
