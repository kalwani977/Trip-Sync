import React, { useRef, useEffect } from 'react';
import './DestinationCarousel.css';

export default function DestinationCarousel({ cards }) {
  const carouselRef = useRef(null);

  // Duplicate cards 3 times to create an infinite scroll illusion
  const infiniteCards = cards && cards.length > 0 
    ? [...cards, ...cards, ...cards].map((card, index) => ({
        ...card,
        uniqueId: `${index}-${card.id}`
      }))
    : [];

  const CARD_WIDTH = 320; // 300px width + 20px gap

  useEffect(() => {
    if (carouselRef.current && cards && cards.length > 0) {
      // Start at the beginning of the middle set
      carouselRef.current.scrollLeft = cards.length * CARD_WIDTH;
    }
  }, [cards]);

  const handleScroll = () => {
    if (!carouselRef.current || !cards || cards.length === 0) return;
    
    const { scrollLeft } = carouselRef.current;
    const setWidth = cards.length * CARD_WIDTH;

    // If scrolled into the first set (near the start)
    if (scrollLeft < CARD_WIDTH) {
      // Jump to the corresponding position in the middle set
      carouselRef.current.scrollLeft += setWidth;
    } 
    // If scrolled into the third set (near the end)
    else if (scrollLeft > setWidth * 2 - CARD_WIDTH) {
      // Jump to the corresponding position in the middle set
      carouselRef.current.scrollLeft -= setWidth;
    }
  };

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -CARD_WIDTH : CARD_WIDTH;
      // Use smooth behavior for manual button clicks
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
      
      <div 
        className="destination-carousel" 
        ref={carouselRef}
        onScroll={handleScroll}
      >
        {infiniteCards.map((card) => (
          <div key={card.uniqueId} className="carousel-card">
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
