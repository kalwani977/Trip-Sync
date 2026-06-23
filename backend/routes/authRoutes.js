import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import { UserModel, OtpModel } from "../db.js";

const router = express.Router();

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { status: "Too many password reset requests from this IP, please try again after 15 minutes" }
});

router.post("/register", async (req, res) => {
  const { 
    username,
    email,
    password,
    firstname,
    lastname,
    gender,
    dob,
    nationality,
    city,
    state,
    phone_number
   } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ status: "Provide username, email, and password" });
  }

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) return res.status(400).json({ status: "Already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      firstname,
      lastname,
      gender,
      dob,            
      nationality,
      city,
      state,
      phone_number
    });

    res.json({ status: "Signup successful", userId: user._id });
  } catch (err) {
    res.status(500).json({ status: "Server error", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ status: "Provide email and password" });

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ status: "No records found!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ status: "Wrong password" });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_PASSWORD, { expiresIn: "1d" });

    res.json({ status: "Success", token, userId: user._id });
  } catch (err) {
    res.status(500).json({ status: "Server error", error: err.message });
  }
});

router.post("/forgot-password", passwordResetLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ status: "Email is required" });

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ status: "No account with this email" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to DB
    await OtpModel.create({ email, otp });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send email
    await transporter.sendMail({
      from: `"TripSync" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 TripSync Password Reset OTP",
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #1a1a1a; color: #fff; border-radius: 10px;">
          <h2 style="color: #9a5db8;">TripSync Password Reset</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #D4AF37; letter-spacing: 5px;">${otp}</h1>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #888;">If you didn't request this, ignore this email.</p>
        </div>
      `
    });

    res.json({ status: "OTP sent to your email" });
  } catch (err) {
    console.error("EMAIL ERROR:", err.message);
    res.status(500).json({ status: "Failed to send OTP", error: err.message });
  }
});

router.post("/reset-password", passwordResetLimiter, async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ status: "All fields required" });
  }

  try {
    const storedOtp = await OtpModel.findOne({ email, otp });
    
    if (!storedOtp) return res.status(400).json({ status: "Invalid OTP or expired. Request a new one." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.findOneAndUpdate({ email }, { password: hashedPassword });

    await OtpModel.deleteOne({ _id: storedOtp._id }); // Clear used OTP
    res.json({ status: "Password reset successful! You can now login." });
  } catch (err) {
    res.status(500).json({ status: "Failed to reset password" });
  }
});

export default router;
