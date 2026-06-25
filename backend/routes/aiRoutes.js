import express from "express";
import { userMiddleware } from "../middleware/authMiddleware.js";
import { generateItinerary } from "../controllers/aiController.js";

const router = express.Router();

router.post("/generate-itinerary", userMiddleware, generateItinerary);

export default router;
