import React, { useRef } from 'react';
import './DestinationCarousel.css';

export default function DestinationCarousel({ cards }) {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleExplore = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!cards || cards.length === 0) {
    return <p className="no-results">No destinations match your search. Try another vibe!</p>;
  }

  return (
    <div className="destination-carousel-container">
      <button className="carousel-nav-btn left" onClick={() => scroll('left')}>‹</button>
      
      <div className="destination-carousel" ref={carouselRef}>
        {cards.map((card) => (
          <div key={card.id} className="carousel-card">
            <div className="carousel-image-wrapper">
              <img src={card.image} alt={card.location} />
              <div className="carousel-overlay">
                <p className="carousel-category">{card.title}</p>
                <h4 className="carousel-location">{card.location}</h4>
                <p className="carousel-date">{card.date}</p>
              </div>
            </div>
            <div className="carousel-details">
              <p className="carousel-desc">{card.description}</p>
              <button className="explore-btn" onClick={() => handleExplore(card.exploreUrl)}>
                EXPLORE
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="carousel-nav-btn right" onClick={() => scroll('right')}>›</button>
    </div>
  );
}
