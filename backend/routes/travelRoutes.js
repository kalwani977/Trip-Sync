import express from "express";
import { userMiddleware } from "../middleware/authMiddleware.js";
import { getEvents } from "../controllers/eventController.js";
import { getFlights } from "../controllers/flightController.js";
import { getHotels } from "../controllers/hotelController.js";
import { getRoute, getMapRoute } from "../controllers/routeController.js";
import { getWeather } from "../controllers/weatherController.js";
import { orchestrateTrip } from "../controllers/orchestratorController.js";

const router = express.Router();

router.get('/events', userMiddleware, getEvents);
router.get('/flights', userMiddleware, getFlights);
router.get('/hotels', userMiddleware, getHotels);
router.get('/route', userMiddleware, getRoute);
router.post('/map', userMiddleware, getMapRoute);
router.get('/weather', userMiddleware, getWeather);
router.post('/orchestrate', userMiddleware, orchestrateTrip);

export default router;
