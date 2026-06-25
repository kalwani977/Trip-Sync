import express from "express";
import { userMiddleware } from "../middleware/authMiddleware.js";
import { getEvents } from "../controllers/eventController.js";
import { getFlights } from "../controllers/flightController.js";
import { getHotels } from "../controllers/hotelController.js";
import { getRoute, getMapRoute } from "../controllers/routeController.js";
import { getWeather } from "../controllers/weatherController.js";
import { orchestrateTrip } from "../controllers/orchestratorController.js";

const router = express.Router();

router.get('/events', getEvents);
router.get('/flights', getFlights);
router.get('/hotels', getHotels);
router.get('/route', getRoute);
router.post('/map', getMapRoute);
router.get('/weather', getWeather);
router.post('/orchestrate', userMiddleware, orchestrateTrip);

export default router;
