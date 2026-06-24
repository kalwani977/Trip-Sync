import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
 
import "../styles/Login.css";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  
  // Forgot Password States
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Registration States
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [nationality, setNationality] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/login`, { email, password });
        if (res.data.status === "Success") {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("userId", res.data.userId);
          navigate("/");
        } else { toast.error(res.data.status); }
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/register`, { 
          username, email, password, firstname, lastname, 
          gender, dob, city, state, nationality, phone_number: phoneNumber 
        });
        toast.success(res.data.status);
        setIsLogin(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.status || "Error! Please try again.");
    }
  };

  // --- FORGOT PASSWORD: Send OTP ---
  const handleSendOtp = async () => {
    if (!forgotEmail) return toast.error("Enter your email");
    setForgotLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/forgot-password`, { email: forgotEmail });
      toast.success(res.data.status);
      setOtpSent(true);
    } catch (err) {
      toast.error(err.response?.data?.status || "Failed to send OTP");
    } finally {
      setForgotLoading(false);
    }
  };

  // --- FORGOT PASSWORD: Reset ---
  const handleResetPassword = async () => {
    if (!otp || !newPassword) return toast.error("Enter OTP and new password");
    setForgotLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/reset-password`, {
        email: forgotEmail, otp, newPassword
      });
      toast.success(res.data.status);
      setShowForgot(false);
      setOtpSent(false);
      setOtp("");
      setNewPassword("");
      setForgotEmail("");
    } catch (err) {
      toast.error(err.response?.data?.status || "Failed to reset password");
    } finally {
      setForgotLoading(false);
    }
  };

  // --- FORGOT PASSWORD UI ---
  if (showForgot) {
    return (
      <div className="login-page-wrapper">
                <div className="login-container">
          <div className="login-form">
            <div className="form-header">
              <h2>Reset Password</h2>
              <p>{otpSent ? "Enter the OTP sent to your email" : "We'll send you a verification code"}</p>
            </div>

            <div className="form-body">
              <div className="main-inputs">
                <input
                  type="email"
                  placeholder="Your registered email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={otpSent}
                />

                {otpSent && (
                  <>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </>
                )}
              </div>
            </div>

            {!otpSent ? (
              <button type="button" className="submit-btn" onClick={handleSendOtp} disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send OTP"}
              </button>
            ) : (
              <button type="button" className="submit-btn" onClick={handleResetPassword} disabled={forgotLoading}>
                {forgotLoading ? "Resetting..." : "Reset Password"}
              </button>
            )}

            <p className="toggle-text">
              Remember your password?
              <span className="toggle-link" onClick={() => { setShowForgot(false); setOtpSent(false); }}>
                {" "}Back to Login
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN LOGIN/REGISTER UI ---
  return (
    <div className="login-page-wrapper">
            <div className="login-container">
        <form className={`login-form ${!isLogin ? "signup-mode" : ""}`} onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
            <p>Access your global travel dashboard</p>
          </div>

          <div className="form-body">
            {!isLogin && (
              <div className="signup-grid">
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                <input type="text" placeholder="First Name" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
                <input type="text" placeholder="Last Name" value={lastname} onChange={(e) => setLastname(e.target.value)} />
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <input type="text" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
            )}

            <div className="main-inputs">
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="submit-btn">{isLogin ? "LOG IN" : "SIGN UP"}</button>

          {isLogin && (
            <p className="forgot-link" onClick={() => setShowForgot(true)}>
              Forgot Password?
            </p>
          )}

          <p className="toggle-text">
            {isLogin ? "Don't have an account?" : "Already a member?"}
            <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? " Register" : " Login"}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
