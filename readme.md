# TripSync: Plan. Compare. Travel.

## ~ Vision

TripSync is a smart, agent-based travel planning platform that brings together all essential travel components — weather, routes, flights, hotels, events, and budgeting — into a single, seamless experience. Instead of switching between multiple apps, users plan an entire trip in one place with intelligent agents working collaboratively to generate personalized itineraries.

## ~ Highlights

### 1. Multi-Agent Orchestration
Five independent agents (Weather, Route, Flight, Hotel, Events) run in parallel with a live status dashboard, coordinating to build your complete itinerary automatically.

### 2. Smart Calendar Integration
Sync your planned events directly to Google Calendar with automatic reminders (1-hour popup + 1-day email notification) via OAuth2.

### 3. Destination Comparison Engine
Compare two destinations side-by-side on weather, hotel pricing, and event availability — with an intelligent verdict recommending the better choice.

### 4. Day-wise Itinerary Generation
Auto-generates a structured day-by-day plan: Day 1 (Arrival), Day 2–N (Events/Sightseeing), Last Day (Departure) — with weather forecasts per day.

### 5. Budget Optimizer
Highlights "Best Value" flights and "Best Deal" hotels. Provides a full cost breakdown: flights + hotel × nights = total estimated cost.

### 6. AI-like Chatbot (Trekky)
Rule-based NLP chatbot built with compromise.js — supports 10+ intents including trip planning, comparisons, weather, flights, hotels, events, distance, and chitchat. Calls live APIs for real-time data. Zero cost, zero hallucinations.

### 7. Secure Authentication
JWT-based login with bcrypt password hashing. Forgot Password flow with email OTP verification via Nodemailer.

## ~ Why It Matters

**Problems Solved:**
- Switching between 5+ apps to plan a single trip is time-consuming
- No unified view of flights, hotels, events, and weather together
- Manual budget tracking leads to overspending
- Forgetting event dates without calendar sync

**Our Purpose:**
We aim to simplify travel planning by providing:
- Agent-based architecture for parallel data fetching
- Unified itinerary with all bookings in one card
- Budget visibility before you travel
- Google Calendar sync so you never miss an event

## ~ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router v6, React Leaflet, react-chatbot-kit, Axios |
| Backend | Node.js, Express.js, MongoDB (Mongoose), JWT, bcrypt, Nodemailer, compromise (NLP), googleapis |
| APIs | OpenWeatherMap, SerpAPI (Google Flights, Hotels, Events), OpenRouteService, Google Calendar API |
| Tools | Nodemon, dotenv |

## ~ Features

| Category | Feature |
|----------|---------|
| Basic | Web Dashboard, Weather Agent, Trip Summary Card, Budget Breakdown, Day-wise Itinerary |
| Intermediate | Multi-Agent Orchestration, Event Recommendations, Google Calendar Sync + Reminders, Comparison Mode |
| Advanced | MCP-style Orchestrator Endpoint (`/api/orchestrate`), Budget Optimizer (Best Value/Deal badges) |
| Bonus | Chatbot (Trekky), Forgot Password (Email OTP), Google OAuth, Route Visualization, Multiple Itineraries, Profile Management |

## ~ Process Flow

```
1. Register / Login (JWT + Email OTP for password reset)
         |
2. Dashboard (Browse travel inspiration, search destinations)
         |
3. Trip Planner (Enter source, destination, dates, budget)
         |
4. Agent Orchestration (5 agents run in parallel with live status)
         |
5. Select Flights / Hotels / Events (with Best Value badges)
         |
6. Final Itinerary Card (Day-wise plan + Budget + Weather + Bookings)
         |
7. Google Calendar Sync (Events added with reminders)
```

## ~ Chatbot — Trekky

| Intent | Example Query |
|--------|--------------|
| Plan Trip | "Plan my trip to Goa" |
| Compare | "Compare Mumbai and Delhi" |
| Weather | "Weather in Jaipur" |
| Flights | "Flights from Delhi to Goa on 2026-08-01" |
| Hotels | "Hotels in Goa" |
| Events | "Events in Mumbai" |
| Distance | "Distance between Delhi and Agra" |
| Chitchat | "hi", "help", "tell me a joke", "best place to visit" |

Built with compromise.js for NLP — no paid AI APIs. Returns live data from real APIs.

## ~ Getting Started

Follow these steps to run the project locally:

### 1. Clone the repository

```bash
git clone https://github.com/akakhushiverma/TripSync.git
cd TripSync
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:

```
PORT=3000
JWT_PASSWORD=your_jwt_secret

SERPAPI_KEY=your_serpapi_key
OPENWEATHER_API_KEY=your_openweather_key
OPENROUTE_KEY=your_openroute_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Start the server:

```bash
node server.js
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Visit `http://localhost:5173` to see the app in action.

## ~ API Keys Required

| API | Free Tier | Get Key |
|-----|-----------|---------|
| SerpAPI | 100 searches/month | [serpapi.com](https://serpapi.com) |
| OpenWeatherMap | 1000 calls/day | [openweathermap.org](https://openweathermap.org/api) |
| OpenRouteService | 2000 calls/day | [openrouteservice.org](https://openrouteservice.org/dev/#/signup) |
| Google Calendar | Free | [console.cloud.google.com](https://console.cloud.google.com) |
| Gmail (Nodemailer) | Free | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) |

## ~ Project Structure

```
TripSync/
├── backend/
│   ├── server.js              # Main server with all routes
│   ├── db.js                  # MongoDB schemas (User, Itinerary)
│   ├── routes/
│   │   └── chatbot.js         # Trekky NLP chatbot
│   ├── .env                   # Environment variables (not committed)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # Dashboard, Planner, Flights, Hotels, Events,
│   │   │                      # Weather, Route, Compare, Profile, Login,
│   │   │                      # Itinerary, ItineraryCard, MyItineraries
│   │   ├── components/        # Nav, BannerCarousel, Chatbot/
│   │   ├── styles/            # CSS for each page
│   │   ├── App.jsx            # Route definitions
│   │   └── main.jsx           # Entry point
│   └── package.json
│
├── .gitignore
└── readme.md
```

## ~ Contributing

If you'd like to contribute to TripSync, we welcome your input:

1. **Fork** the repository
2. **Create** a new branch: `git checkout -b feature-name`
3. **Commit** your changes: `git commit -m "Add feature description"`
4. **Push** to the branch: `git push origin feature-name`
5. **Submit** a Pull Request with a detailed description

## ~ Languages

- JavaScript — 75%
- CSS — 24.5%
- HTML — 0.5%
