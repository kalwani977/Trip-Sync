import express from "express";
import { userMiddleware } from "../middleware/authMiddleware.js";
import { 
    getEvents, 
    getFlights, 
    getHotels, 
    getRoute, 
    getMapRoute, 
    getWeather, 
    orchestrateTrip 
} from "../controllers/travelController.js";

const router = express.Router();

router.get('/events', getEvents);
router.get('/flights', getFlights);
router.get('/hotels', getHotels);
router.get('/route', getRoute);
router.post('/map', getMapRoute);
router.get('/weather', getWeather);
router.post('/orchestrate', userMiddleware, orchestrateTrip);

export default router;
