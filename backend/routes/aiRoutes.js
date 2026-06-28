import express from "express";
import { userMiddleware } from "../middleware/authMiddleware.js";
import { generateItinerary, regenerateDay } from "../controllers/aiController.js";

const router = express.Router();

router.post("/generate-itinerary", userMiddleware, generateItinerary);
router.post("/regenerate-day", userMiddleware, regenerateDay);

export default router;
