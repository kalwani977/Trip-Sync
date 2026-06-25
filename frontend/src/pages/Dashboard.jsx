import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import DestinationCarousel from "../components/DestinationCarousel";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  // -------- 20 CURATED TRAVEL CARDS --------
  const travelCards = [
    { id: 1, title: "Beach Destination", location: "Goa, India", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2", date: "Nov – Feb", description: "Golden beaches, nightlife, water sports, and laid-back coastal vibes.", exploreUrl: "https://goa-tourism.com/" },
    { id: 2, title: "Spiritual Destination", location: "Varanasi, India", image: "https://images.unsplash.com/photo-1561359313-0639aad49ca6", date: "Oct – Mar", description: "Ancient ghats, Ganga aarti, spiritual rituals, and timeless traditions.", exploreUrl: "https://varanasi.nic.in/tourism/" },
    { id: 3, title: "Historical Destination", location: "Agra, India", image: "https://www.tajmahal.gov.in/images/banners/pages/travel-information.jpg", date: "Oct – Feb", description: "Home to the Taj Mahal, Mughal architecture, and rich Indian history.", exploreUrl: "https://www.tajmahal.gov.in/" },
    { id: 4, title: "Nature Retreat", location: "Manali, India", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23", date: "Dec – Feb", description: "Snowy mountains, adventure sports, scenic valleys, and cozy stays.", exploreUrl: "https://himachaltourism.gov.in/" },
    { id: 5, title: "Royal Heritage", location: "Jaipur, Rajasthan", image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a", date: "Oct – Mar", description: "Pink City charm with Amber Fort, Hawa Mahal, and royal palaces.", exploreUrl: "https://obms-tourist.rajasthan.gov.in/citydetail/jaipur" },
    { id: 6, title: "Backwater Escape", location: "Kerala Backwaters", image: "https://tse3.mm.bing.net/th/id/OIP.xs2Bp1CRnkTpXLqZOLqUJwHaE7?pid=Api&P=0&h=180", date: "Sep – Mar", description: "Houseboat stays through palm-lined canals and peaceful lagoons.", exploreUrl: "https://www.keralatourism.org/destination/backwater/" },
    { id: 7, title: "Romantic Getaway", location: "Udaipur, Rajasthan", image: "https://images.unsplash.com/photo-1690708186073-17037cd66467?q=80&w=1187&auto=format&fit=crop", date: "Oct – Feb", description: "City of Lakes with palace views, sunsets, and heritage hotels.", exploreUrl: "https://obms-tourist.rajasthan.gov.in/citydetail/Udaipur" },
    { id: 8, title: "Adventure & Spirituality", location: "Rishikesh, Uttarakhand", image: "https://dynamic-media.tacdn.com/media/photo-o/2f/45/ec/7e/caption.jpg?w=800&h=600&s=1", date: "Feb – Jun", description: "River rafting, yoga retreats, and the sacred Ganges river.", exploreUrl: "https://uttarakhandtourism.gov.in/" },
    { id: 9, title: "Alpine Fairytale", location: "Switzerland", image: "https://dynamic-media.tacdn.com/media/photo-o/2f/7e/08/1c/caption.jpg?w=1100&h=800&s=1", date: "Dec – Apr", description: "Snow-capped Alps, scenic trains, ski resorts, and villages.", exploreUrl: "https://www.myswitzerland.com/" },
    { id: 10, title: "Island Paradise", location: "Bali, Indonesia", image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2", date: "Apr – Oct", description: "Beaches, temples, rice terraces, wellness, and nightlife.", exploreUrl: "https://balitourismboard.info/" },
    { id: 11, title: "City of Love", location: "Paris, France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34", date: "Apr – Jun", description: "Romantic cafés, Eiffel Tower, museums, and art.", exploreUrl: "https://parisjetaime.com/eng/" },
    { id: 12, title: "Urban Dream", location: "New York City, USA", image: "https://tse1.mm.bing.net/th/id/OIP.LZQ493D4VfmToWcne_Vi_gHaE8?pid=Api&P=0&h=180", date: "Sep – Nov", description: "Broadway shows, skyline views, Central Park, Times Square.", exploreUrl: "https://www.nyctourism.com/" },
    { id: 13, title: "Vibrant Nightlife", location: "Thailand", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", date: "Nov – Apr", description: "Beach parties, rooftop bars, and island escapes.", exploreUrl: "https://www.tourismthailand.org/" },
    { id: 14, title: "Luxury & Glamour", location: "Dubai, UAE", image: "https://images.pexels.com/photos/162031/dubai-tower-arab-khalifa-162031.jpeg", date: "Nov – Mar", description: "Sky-high luxury, desert safaris, and elite experiences.", exploreUrl: "https://www.visitdubai.com/" },
    { id: 15, title: "Private Island Escape", location: "Maldives", image: "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg", date: "Nov – Apr", description: "Overwater villas, crystal-clear waters, honeymoon bliss.", exploreUrl: "https://visitmaldives.com/" },
    { id: 16, title: "Cultural Classic", location: "Rome, Italy", image: "https://images.unsplash.com/photo-1529260830199-42c24126f198", date: "Apr – Jun", description: "Ancient ruins, Roman architecture, and world-class cuisine.", exploreUrl: "https://www.turismoroma.it/" },
    { id: 17, title: "Nature & Fjords", location: "Norway", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee", date: "May – Aug", description: "Fjords, waterfalls, northern lights, and scenic landscapes.", exploreUrl: "https://www.visitnorway.com/" },
    { id: 18, title: "Desert Adventure", location: "Morocco", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93", date: "Mar – May", description: "Sahara dunes, colorful souks, and ancient cities.", exploreUrl: "https://www.visitmorocco.com/" },
    { id: 19, title: "Love Wrapped in Snow", location: "Kashmir, India", image: "https://images.pexels.com/photos/29955492/pexels-photo-29955492.jpeg", date: "Dec – Apr", description: "Explore gulmarg and beauliful vibe of kashmir.", exploreUrl: "https://tourism.gov.in/jammu-kashmir" },
    { id: 20, title: "Cherry Blossom Season", location: "Japan", image: "https://images.unsplash.com/photo-1549693578-d683be217e58", date: "Mar – Apr", description: "Sakura blooms, temples, modern cities, and traditions.", exploreUrl: "https://www.japan.travel/" }
  ];

  // Logic for scroll listener (Back-to-top button)
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredCards = travelCards.filter(card =>
    card.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      
      {/* --- HERO SECTION --- */}
      <div className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="hero-title">
              <span className="small-line">plan your trip with</span>
              <span className="big-line">TripSync</span>
            </div>
            
            <div className="search-container">
              <div className="hero-search-bar">
                <input 
                  type="text" 
                  placeholder="Where do you want to go?" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      navigate('/planner', { state: { prefilledDestination: searchTerm } });
                    }
                  }}
                />
                <button 
                  className="hero-search-btn"
                  onClick={() => navigate("/planner", { state: { prefilledDestination: searchTerm } })}
                >
                  Plan Trip →
                </button>
              </div>
            </div>

            <div className="info-stats">
              <div className="stat-item"><span>500+</span> Flights</div>
              <div className="stat-item"><span>200+</span> Hotels</div>
              <div className="stat-item"><span>50+</span> Guides</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="travel-section">
          <h2 className="section-title">
            {searchTerm ? `Results for "${searchTerm}"` : "Trending Destinations"}
          </h2>
          
          <DestinationCarousel cards={filteredCards} />
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="dashboard-footer">
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
        <p>© 2026 TripSync. All Rights Reserved.</p>
      </footer>

      {/* --- BACK TO TOP --- */}
      {showBackToTop && (
        <button className="back-to-top" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          ↑
        </button>
      )}
    </div>
  );
}