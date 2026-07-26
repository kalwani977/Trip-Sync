import express from "express";
import { google } from "googleapis";
import { UserModel } from "../db.js";
import { encryptToken, decryptToken } from "../utils/cryptoUtils.js";
import { userMiddleware } from "../middleware/authMiddleware.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const createOAuth2Client = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET || "",
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/callback"
);


router.get("/status", userMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (user && user.googleTokens) {
      return res.json({ connected: true });
    }
    res.json({ connected: false });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

router.get("/auth", (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send("No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_PASSWORD);
    
    const url = createOAuth2Client().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state: decoded.id // Pass user ID as state
    });
    res.redirect(url);
  } catch (err) {
    res.status(403).send("Invalid token");
  }
});

router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query; // state contains userId

    if (!state) {
      return res.status(400).send("State (userId) missing from callback");
    }

    const { tokens } = await createOAuth2Client().getToken(code);
    
    // Save tokens to DB
    await UserModel.findByIdAndUpdate(state, {
      googleTokens: encryptToken(tokens)
    });

    res.send("Google connected! You can close this tab.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Google Auth failed");
  }
});

router.post("/add-event", userMiddleware, async (req, res) => {
  try {
    const { event } = req.body;
    
    const user = await UserModel.findById(req.userId);
    if (!user || !user.googleTokens) {
      return res.status(401).json({ message: "Google not connected" });
    }

    const oauth2Client = createOAuth2Client();
    const decryptedTokens = decryptToken(user.googleTokens);
    if (!decryptedTokens) {
      return res.status(401).json({ message: "Invalid or corrupted Google tokens" });
    }
    
    oauth2Client.setCredentials(decryptedTokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Parse date - handle various formats
    let eventDate = event.date || new Date().toISOString().split("T")[0];
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      const parsed = new Date(eventDate);
      if (!isNaN(parsed.getTime())) {
        eventDate = parsed.toISOString().split("T")[0];
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        eventDate = tomorrow.toISOString().split("T")[0];
      }
    }

    let startHour = 10;
    if (event.time) {
      const hourMatch = event.time.match(/(\d{1,2})/);
      if (hourMatch) startHour = parseInt(hourMatch[1]);
    }
    const endHour = startHour + 1;

    const startDateTime = `${eventDate}T${String(startHour).padStart(2, "0")}:00:00`;
    const endDateTime = `${eventDate}T${String(endHour).padStart(2, "0")}:00:00`;

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.title || "TripSync Event",
        location: event.venue || event.address || "",
        description: `Booked via TripSync. Ticket Link: ${event.ticket_link || 'N/A'}`,
        start: { 
            dateTime: `${startDateTime}:00Z`
        },
        end: { 
            dateTime: `${endDateTime}:00Z`
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'email', minutes: 1440 }
          ]
        }
      }
    });

    console.log("CALENDAR SUCCESS:", response.data.htmlLink);
    res.json({ success: true, googleEvent: response.data });
  } catch (err) {
    console.error("GOOGLE CALENDAR ERROR:", err.response?.data || err.message);
    res.status(500).json({ message: "Calendar insert failed", error: err.response?.data || err.message });
  }
});

export default router;
