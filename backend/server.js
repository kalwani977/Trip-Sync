import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { ItineraryModel, UserModel } from "./db.js";
import { userMiddleware } from "./middleware/authMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import itineraryRoutes from "./routes/itineraryRoutes.js";
import travelRoutes from "./routes/travelRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// ---------------- Routes ----------------
app.use("/", authRoutes);
app.use("/api", userRoutes);
app.use("/api/itinerary", itineraryRoutes);
app.use("/api", travelRoutes);
app.use("/api/ai", aiRoutes);



// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));