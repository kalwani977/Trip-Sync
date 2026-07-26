import express from "express";
import { ItineraryModel } from "../db.js";
import { userMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/create', userMiddleware, async (req, res) => {
  const { destination, startdate, enddate } = req.body;

  if (!destination || !startdate || !enddate) {
    return res.status(400).json({ message: "Missing required itinerary fields" });
  }
  try {
    const newItinerary = await ItineraryModel.create({
      userId: req.userId,      // from JWT middleware
      destination,
      startdate,
      enddate,
      events: [],
      flightdetails: null,
      hoteldetails: null
    });

    res.status(200).json({
      message: "Itinerary created",
      itineraryId: newItinerary._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create itinerary"
    });
  }
});

router.post("/event", userMiddleware, async (req, res) => {
  const { itineraryId, event } = req.body;

  if (!itineraryId || !event) {
    return res.status(400).json({
      message: "itineraryId and event are required"
    });
  }

  try {
    const itinerary = await ItineraryModel.findOneAndUpdate(
      {
        _id: itineraryId,
        userId: req.userId // ensure owner
      },
      {
        $push: { events: event }
      },
      { new: true }
    );

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerary not found or unauthorized"
      });
    }

    res.json({ message: "Event added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to add event"
    });
  }
});

router.post("/flight", userMiddleware, async (req, res) => {
  const { itineraryId, flightdetails } = req.body;

  if (!itineraryId || !flightdetails) {
    return res.status(400).json({
      message: "itineraryId and flightdetails are required"
    });
  }

  try {
    const itinerary = await ItineraryModel.findOneAndUpdate(
      {
        _id: itineraryId,
        userId: req.userId
      },
      {
        $set: { flightdetails }
      },
      { new: true }
    );

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerary not found or unauthorized"
      });
    }

    res.json(itinerary);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to add flight"
    });
  }
});

//----------return flighst add-----------
router.post("/returnflight", userMiddleware, async (req, res) => {
  const { itineraryId, returnflight } = req.body;

  if (!itineraryId || !returnflight) {
    return res.status(400).json({
      message: "itineraryId and returnflight are required"
    });
  }

  try {
    const itinerary = await ItineraryModel.findOneAndUpdate(
      {
        _id: itineraryId,
        userId: req.userId
      },
      {
        $set: { returnflight }
      },
      { new: true }
    );

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerary not found or unauthorized"
      });
    }

    res.json(itinerary);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to add flight"
    });
  }
});

router.post("/hotel", userMiddleware, async (req, res) => {
  const { itineraryId, hoteldetails } = req.body;

  if (!itineraryId || !hoteldetails) {
    return res.status(400).json({
      message: "itineraryId and hoteldetails are required"
    });
  }

  try {
    const itinerary = await ItineraryModel.findOneAndUpdate(
      {
        _id: itineraryId,
        userId: req.userId
      },
      {
        $set: { hoteldetails }
      },
      { new: true }
    );

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerary not found or unauthorized"
      });
    }

    res.json(itinerary);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to add hotel"
    });
  }
});

router.get("/:id", userMiddleware, async (req, res) => {
  try {
    const itinerary = await ItineraryModel.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    res.json(itinerary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch itinerary" });
  }
});

// Since the server.js binds to /api/itineraries, we will bind this route directly in server.js or change it to /api/itinerary/all
// I'll leave it as is but export a separate router, or just put it in itineraryRoutes for /all, wait, the original was app.get("/api/itineraries").
// I'll make it router.get("/", ...) and bind it to /api/itineraries in server.js
router.get("/", userMiddleware, async (req, res) => {
  try {
    const itineraries = await ItineraryModel.find({
      userId: req.userId
    }).sort({ _id: -1 }); // latest first (optional)

    res.json({
      itineraries
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch itineraries" });
  }
});

router.delete("/:id", userMiddleware, async (req, res) => {
  try {
    const itinerary = await ItineraryModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found or unauthorized" });
    }

    res.json({ message: "Itinerary deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete itinerary" });
  }
});

router.post("/remove-item", userMiddleware, async (req, res) => {
  const { itineraryId, itemType } = req.body;
  
  if (!itineraryId || !itemType) {
    return res.status(400).json({ message: "itineraryId and itemType are required" });
  }

  try {
    const updateQuery = {};
    if (itemType === "flight") {
      updateQuery.$unset = { flightdetails: 1, returnflight: 1 };
    } else if (itemType === "hotel") {
      updateQuery.$unset = { hoteldetails: 1 };
    } else {
      return res.status(400).json({ message: "Invalid itemType" });
    }

    const itinerary = await ItineraryModel.findOneAndUpdate(
      { _id: itineraryId, userId: req.userId },
      updateQuery,
      { new: true }
    );

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found or unauthorized" });
    }

    res.json(itinerary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove item" });
  }
});

export default router;
