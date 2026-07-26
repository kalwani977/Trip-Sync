# TripSync

A full-stack travel planning application where five independent backend agents — weather, flights, hotels, events, and route — run in parallel using `Promise.allSettled` to assemble a complete trip itinerary from a single request.

---

## Problem Statement

Planning a trip means switching between weather apps, flight aggregators, hotel platforms, event finders, and map tools, then manually stitching everything together. No single tool fetches and organises all of this at once, and no tool stores the final plan for later reference.

## Solution

TripSync provides a single `POST /api/orchestrate` endpoint. On request, five agents execute concurrently. Results are merged into a structured response, the user selects what they want, and the final itinerary is stored per-user in MongoDB. A 30-minute in-memory cache prevents duplicate API calls for repeated searches.

---

## Key Features

| Feature | Implementation detail |
|---------|----------------------|
| **Parallel agent orchestration** | `Promise.allSettled` — one agent failing does not block others |
| **30-min in-memory cache** | Map-based TTL cache in `travelUtils.js` — reduces SerpAPI quota usage |
| **Itinerary CRUD** | Owner-scoped MongoDB queries (`userId: req.userId`) on every read/write |
| **Destination comparison** | Side-by-side weather, hotel pricing, and event availability for two cities |
| **Forgot password via OTP** | 6-digit OTP, MongoDB TTL index auto-deletes after 10 min; Nodemailer over Gmail SSL port 465; dev-mode console fallback |
| **Rate limiting** | `express-rate-limit` per route: 5 register/hour, 10 login/15min, 5 OTP requests/15min |
| **AI itinerary generation** | Groq API via `/api/ai/generate-itinerary` and `/api/ai/regenerate-day` |
| **Global airport lookup** | IATA dictionary covering 60+ city names; falls back to raw 3-letter codes |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 7 | SPA, fast dev HMR |
| Routing | React Router v6 | Client-side navigation |
| Maps | React Leaflet | Route visualisation |
| HTTP | Axios | API calls with auth headers |
| Backend | Node.js + Express.js | REST API server |
| Database | MongoDB + Mongoose | User and itinerary persistence |
| Auth | JWT + bcrypt | Stateless auth, hashed passwords |
| Email | Nodemailer (Gmail SSL 465) | OTP delivery |
| Flights / Hotels / Events | SerpAPI | Google Flights, Hotels, Events |
| Weather | OpenWeatherMap | 5-day forecast |
| Routes | OpenRouteService | Geocoding + driving directions |
| AI | Groq API (LLaMA 3) | AI itinerary generation and day regeneration |

---

## Architecture

```
Browser (React + Vite :5173)
        │
        ▼
Express Server (:3000)
        │
        ├── JWT Middleware  →  all /api/* routes
        │
        ├── POST /api/orchestrate
        │       └── Promise.allSettled([
        │             Weather  → OpenWeatherMap
        │             Route    → OpenRouteService (geocode + directions)
        │             Flights  → SerpAPI Google Flights (cached)
        │             Hotels   → SerpAPI Google Hotels (cached)
        │             Events   → SerpAPI Google Events (cached, global)
        │           ])
        │
        ├── /api/itinerary/*       → MongoDB CRUD, owner-scoped
        ├── /api/ai/*              → Groq AI generation
        ├── /register /signin      → JWT, bcrypt, rate-limited
        └── /forgot-password       → OTP → Nodemailer → MongoDB TTL auto-delete
```

---

## Database Schemas

**User** — `username`, `email` (unique), `password` (bcrypt hashed), `googleTokens` (AES encrypted), optional profile fields.

**Itinerary** — `userId` (ref, indexed), `destination`, `startdate`, `enddate`, `events[]`, `flightdetails`, `returnflight`, `hoteldetails`.

**Otp** — `email`, `otp`, `createdAt` with `expires: 600` — MongoDB TTL index removes expired OTPs automatically.

---

## API Endpoints

### Auth (no JWT required)
| Method | Endpoint | Rate limit | Description |
|--------|---------|-----------|-------------|
| POST | `/register` | 5/hour | Create account |
| POST | `/signin` | 10/15min | Login, returns JWT |
| POST | `/forgot-password` | 5/15min | Send OTP to email |
| POST | `/reset-password` | 5/15min | Verify OTP, update password |

### Travel (JWT required)
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/orchestrate` | Run all 5 agents in parallel |
| GET | `/api/flights?from=&to=&out_date=` | Search flights |
| GET | `/api/hotels?city=&check_in=&check_out=` | Search hotels |
| GET | `/api/events?city=&start_date=&end_date=` | Search events globally |
| GET | `/api/weather?city=` | 5-day forecast |
| GET | `/api/route?from=&to=` | Driving distance and duration |
| POST | `/api/map` | Detailed turn-by-turn route |

### Itinerary (JWT required)
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/itinerary/create` | Create new itinerary |
| GET | `/api/itinerary/` | List all user itineraries (latest first) |
| GET | `/api/itinerary/:id` | Fetch single itinerary |
| DELETE | `/api/itinerary/:id` | Delete itinerary |
| POST | `/api/itinerary/flight` | Save going flight |
| POST | `/api/itinerary/returnflight` | Save return flight |
| POST | `/api/itinerary/hotel` | Save hotel selection |
| POST | `/api/itinerary/event` | Add event to itinerary |
| POST | `/api/itinerary/remove-item` | Remove flight or hotel |

### User (JWT required)
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/profile` | Fetch user profile (password excluded) |
| PUT | `/api/profile` | Update profile fields |

### AI (JWT required)
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/ai/generate-itinerary` | Generate day-wise itinerary via Groq |
| POST | `/api/ai/regenerate-day` | Regenerate a specific day's plan |

---

## Project Structure

```
TripSync/
├── backend/
│   ├── server.js                    # Entry point, route mounting
│   ├── db.js                        # Mongoose connection + all schemas
│   ├── controllers/
│   │   ├── orchestratorController.js  # Promise.allSettled parallel runner
│   │   ├── flightController.js
│   │   ├── hotelController.js
│   │   ├── eventController.js
│   │   ├── weatherController.js
│   │   ├── routeController.js
│   │   └── aiController.js           # Groq AI itinerary generation
│   ├── routes/
│   │   ├── authRoutes.js             # Register, login, OTP password reset
│   │   ├── travelRoutes.js           # All travel data endpoints
│   │   ├── itineraryRoutes.js        # Itinerary CRUD
│   │   ├── userRoutes.js             # Profile get/update
│   │   └── aiRoutes.js               # Groq AI routes
│   ├── middleware/
│   │   └── authMiddleware.js         # JWT validation
│   └── utils/
│       ├── travelUtils.js            # Cache, IATA map, geocoding
│       └── cryptoUtils.js            # AES encrypt/decrypt for Google tokens
│
└── frontend/
    └── src/
        ├── pages/                    # Dashboard, TripPlanner, FlightSearch,
        │                             # Hotels, Events, Weather, RouteFinder,
        │                             # Itinerary, ItineraryCard, MyItineraries,
        │                             # Login, Profile
        ├── components/
        │   ├── Nav.jsx
        │   ├── BannerCarousel.jsx
        │   ├── DestinationCarousel.jsx
        │   ├── Sidebar.jsx
        │   └── itinerary/            # Itinerary sub-components
        ├── styles/                   # Per-page CSS
        ├── App.jsx                   # Route definitions
        └── main.jsx
```

---

## Local Setup

**Prerequisites:** Node.js ≥ 18, npm ≥ 9, MongoDB Atlas account

```bash
# 1. Clone
git clone https://github.com/kalwani977/Trip-Sync.git
cd Trip-Sync

# 2. Backend
cd backend
npm install
# Create .env from .env.example and fill in keys
npm start              # nodemon on :3000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev            # Vite on :5173
```

Open **http://localhost:5173**

---

## Environment Variables

`backend/.env.example`:

```env
# Server
PORT=3000
JWT_PASSWORD=your_jwt_secret

# Database
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/

# Search APIs
SERPAPI_KEY=
OPENWEATHER_API_KEY=
OPENROUTE_KEY=
FOURSQUARE_API_KEY=

# AI
GROQ_API_KEY=

# Google OAuth (Calendar sync)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Email OTP
# Use a 16-character Gmail App Password (not your login password)
# Generate at: https://myaccount.google.com/apppasswords
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=yoursixteenchars

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

> **Dev mode:** If `EMAIL_USER` / `EMAIL_PASS` are absent, OTPs print to the server console. No crash, no config needed for local testing.

---

## API Keys

| API | Free Tier | Link |
|-----|-----------|------|
| SerpAPI | 100 searches/month | [serpapi.com](https://serpapi.com) |
| OpenWeatherMap | 1,000 calls/day | [openweathermap.org](https://openweathermap.org/api) |
| OpenRouteService | 2,000 calls/day | [openrouteservice.org](https://openrouteservice.org) |
| Groq | Free tier | [console.groq.com](https://console.groq.com) |
| Foursquare | Free tier | [developer.foursquare.com](https://developer.foursquare.com) |
| Google Cloud (Calendar) | Free | [console.cloud.google.com](https://console.cloud.google.com) |

---

## Why This Project Stands Out

**Parallel agents with graceful degradation** — `Promise.allSettled` means if one agent times out (e.g., route API is slow), the other four still return their results. The response always includes whatever succeeded.

**Cache before quota** — SerpAPI has a 100-search/month free cap. The 30-minute in-memory cache means repeated searches for the same city/date return instantly without burning quota.

**Rate limiting on attack surfaces** — Registration, login, and password reset each have separate `express-rate-limit` configurations to resist brute force and account enumeration.

**Groq AI for itinerary generation** — Groq's LLaMA 3 model generates and regenerates day-wise itinerary plans via `/api/ai/generate-itinerary` and `/api/ai/regenerate-day`. Groq's inference speed (sub-300ms on free tier) makes it practical for interactive use without a loading spinner.

---

## Limitations

- **SerpAPI free tier** caps at 100 searches/month. The cache reduces this but heavy use will exhaust it quickly.
- **Flight search** depends on SerpAPI's Google Flights coverage. Routes involving small domestic-only airports may return no results.
- **In-memory cache** is cleared on every server restart. For production, this should be replaced with Redis.
- **Google Calendar sync** requires completing the OAuth flow. The redirect URI must match exactly what is configured in Google Cloud Console.
- **No payment integration** — the app tracks bookings in the itinerary but does not handle actual booking transactions.

---

## Future Improvements

These are genuine architectural gaps that would make the project meaningfully more useful, not cosmetic additions:

**Multi-destination and intermediate stops**
Currently the app supports only single source → single destination. A real trip often involves multiple cities in sequence (e.g., Delhi → Agra → Jaipur → Mumbai). The itinerary schema and orchestrator would need to support an ordered array of destinations, with agents running per leg.

**Train options alongside flights**
For routes where no direct flight exists, or where the distance makes train more practical (under 500 km in India), the app should suggest train options via the IRCTC or RapidAPI Indian Railways feed. The flight result UI already shows "no direct flights found" — this is the natural place to surface an alternative transport mode.

**Google Calendar integration**
OAuth2 connection to add selected events directly to the user's Google Calendar with 1-hour popup and 1-day email reminders. Backend route and token encryption logic is already implemented in `googleRoutes.js` — pending OAuth2 credentials setup in Google Cloud Console.

**Connecting flight suggestions**
When a direct flight between two airports returns zero results, the system could automatically search for one-stop itineraries through major hubs (DEL, BOM, DXB) and present those with layover time and total duration.

**Persistent cache with Redis**
Replace the in-memory Map with Redis so cached results survive server restarts and can be shared across multiple Node.js instances in a load-balanced setup.

**AI itinerary summaries**
The Groq integration exists (`/api/ai/generate-itinerary`) but could be surfaced more prominently — generating a readable day-wise narrative plan from the raw agent data.
