import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Nav from "../components/Nav";
import "../styles/Hotels.css";
import toast from "react-hot-toast";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945";

export default function Hotels() {
  const location = useLocation();
  const trip = location.state?.trip;

  const city = trip?.destination;
  const checkIn = trip?.start;
  const checkOut = trip?.end;

  const initialData = location.state?.initialData;
  const [hotels, setHotels] = useState(initialData?.hotels || []);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (city && checkIn && checkOut && (!initialData || !initialData.hotels)) {
      fetchHotels();
    }
  }, [city, checkIn, checkOut, initialData]);

  const fetchHotels = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/hotels`, {
        params: { city, check_in: checkIn, check_out: checkOut },
      });
      setHotels(res.data.hotels || []);
    } catch (err) {
      setError("Failed to fetch hotels");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHotel = async (hotel) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/itinerary/hotel`,
        { itineraryId: trip.id, hoteldetails: hotel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedHotel(hotel);
      toast.success("Hotel added to itinerary");
    } catch (err) {
      toast.error("Failed to add hotel");
    }
  };

  const renderHotelCard = (hotel, index) => {
  const isDisabled = selectedHotel?.name === hotel.name;

  // Check if cheapest with good rating
  const prices = hotels
    .map(h => parseInt((h.price || "0").replace(/[₹,]/g, "")) || 0)
    .filter(p => p > 0);
  const cheapestPrice = Math.min(...prices);
  const hotelPrice = parseInt((hotel.price || "0").replace(/[₹,]/g, "")) || 0;
  const isBestDeal = hotelPrice === cheapestPrice && hotel.rating >= 3.5 && hotels.length > 1;

  return (
    <div key={index} className="hotel-card-horizontal">
      {isBestDeal && <span className="best-deal-badge">🏆 Best Deal</span>}
      <div className="hotel-image-horizontal">
        <img
          src={hotel.thumbnail || FALLBACK_IMAGE}
          alt={hotel.name}
          onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
        />
      </div>

      <div className="hotel-details-horizontal">
        <h3 className="hotel-name">{hotel.name}</h3>
        
        <div className="hotel-stats">
          <p className="hotel-price">
            Price: <span>₹{hotel.price !== "N/A" ? hotel.price : "N/A"} / night</span>
          </p>
          <p className="hotel-rating">Rating: ⭐ {hotel.rating}</p>
          <p className="hotel-reviews">Reviews: {hotel.reviews}</p>
        </div>

        <p className="hotel-desc">{hotel.description}</p>

        <div className="hotel-actions">
          <a href={hotel.link} target="_blank" rel="noreferrer" className="view-hotel">
            View Hotel
          </a>

          <button
            className="add-hotel-btn"
            disabled={isDisabled}
            onClick={() => handleAddHotel(hotel)}
          >
            {isDisabled ? "✓ Added" : "+ Add to Itinerary"}
          </button>
        </div>
      </div>
    </div>
  );
};


  return (
    <div className="page-wrapper">
      <Nav />
      <main className="hotels-page">
        <header className="hotels-header">
          <h1 className="hotels-title">Hotels in {city}</h1>
          <p className="hotels-dates">{checkIn} — {checkOut}</p>
        </header>

        {loading && <div className="status-msg">Searching for best stays...</div>}
        {error && <div className="status-msg error">{error}</div>}

        <div className="hotels-grid">
          {hotels.map(renderHotelCard)}
        </div>
      </main>
    </div>
  );
}