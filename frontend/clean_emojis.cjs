const fs = require('fs');
const path = require('path');

function cleanFile(filePath, subs) {
  let content = fs.readFileSync(filePath, 'utf8');
  subs.forEach(([from, to]) => {
    while (content.includes(from)) {
      content = content.replace(from, to);
    }
  });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Cleaned: ' + path.basename(filePath));
}

const base = 'c:/Users/mahik/OneDrive/Desktop/TRIP-SYNC/TripSync/frontend/src';

// FlightSearch.jsx
cleanFile(base + '/pages/FlightSearch.jsx', [
  ['\u2705 EXACT KEY BACKEND EXPECTS', 'exact key backend expects'],
  ['\uD83D\uDCB0 Best Value', 'Best Value'],
  ['\u2713 Selected', 'Selected'],
  ['+ Add to Itinerary', 'Add to Itinerary'],
  ['\u2708\uFE0F Going:', 'Going:'],
]);

// Hotels.jsx
cleanFile(base + '/pages/Hotels.jsx', [
  ['\uD83C\uDFC6 Best Deal', 'Best Deal'],
  ['\u2713 Added', 'Added'],
  ['+ Add to Itinerary', 'Add to Itinerary'],
]);

// ItineraryCard.jsx
cleanFile(base + '/pages/ItineraryCard.jsx', [
  ['\u2605 {data.hoteldetails.rating}', '{data.hoteldetails.rating} / 5'],
]);

// Profile.jsx
cleanFile(base + '/pages/Profile.jsx', [
  ['\u270F\uFE0F Edit Profile', 'Edit Profile'],
  ['\uD83D\uDCCB My Itineraries', 'My Itineraries'],
  ['\uD83D\uDCBE Save Changes', 'Save Changes'],
]);

// TripPlanner.jsx
cleanFile(base + '/pages/TripPlanner.jsx', [
  ['return "\u2713"', 'return "Done"'],
  ['return "\u2715"', 'return "Err"'],
]);

// Weather.jsx
cleanFile(base + '/pages/Weather.jsx', [
  ['\uD83D\uDCA7 {midday.main.humidity}', 'Humidity: {midday.main.humidity}'],
  ['\uD83D\uDCA8 {midday.wind.speed}', 'Wind: {midday.wind.speed}'],
]);

// Chatbot ActionProvider.js
cleanFile(base + '/components/Chatbot/ActionProvider.js', [
  ['\u2728', ''],
  ['\uD83D\uDCA4', ''],
]);

// Chatbot ChatbotWidget.jsx
cleanFile(base + '/components/Chatbot/ChatbotWidget.jsx', [
  ['\u2716', 'X'],
  ['\uD83D\uDCAC', 'Chat'],
]);

// Chatbot config.js
cleanFile(base + '/components/Chatbot/config.js', [
  ['\u2728', ''],
  ['\uD83D\uDCAB', ''],
]);

// DestinationCarousel.jsx
cleanFile(base + '/components/DestinationCarousel.jsx', [
  ['\uD83D\uDCC5 {card.date}', '{card.date}'],
]);

console.log('All emojis removed!');
