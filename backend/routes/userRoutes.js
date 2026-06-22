import express from "express";
import { UserModel } from "../db.js";
import { userMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", userMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "User not found"
      });
    }

    res.status(200).json({
      status: "Success",
      user
    });
  } catch (error) {
    res.status(500).json({
      status: "Server error",
      error: error.message
    });
  }
});

// UPDATE USER PROFILE
router.put("/profile", userMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // from JWT middleware

    const {
      firstname,
      lastname,
      gender,
      dob,
      nationality,
      city,
      state,
      phone_number
    } = req.body;

    // Only allow safe fields to be updated
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        firstname,
        lastname,
        gender,
        dob,
        nationality,
        city,
        state,
        phone_number
      },
      {
        new: true,            // return updated document
        runValidators: true   // enforce schema rules
      }
    ).select("-password");   // never send password

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to update profile",
      error: err.message
    });
  }
});

export default router;
