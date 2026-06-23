import toast from 'react-hot-toast';
import React, { useEffect, useState } from "react";
import axios from "axios";
import Nav from "../components/Nav";
import "../styles/profile.css";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    gender: "",
    dob: "",
    nationality: "",
    city: "",
    state: "",
    email: "",
    phone_number: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setProfile(res.data.user);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/login");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Nav />
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Nav />

      <div className="profile-center">
        {/* Avatar & Name */}
        <div className="profile-header-card">
          <div className="profile-avatar">
            {(profile.firstname?.[0] || "U").toUpperCase()}
          </div>
          <h1 className="profile-name">
            {profile.firstname || "User"} {profile.lastname || ""}
          </h1>
          <p className="profile-email">{profile.email}</p>
        </div>

        {/* Profile Form */}
        <div className="profile-card">
          <h3 className="profile-section-title">Personal Information</h3>

          <div className="profile-grid">
            <div className="profile-field">
              <label>First Name</label>
              <input
                name="firstname"
                value={profile.firstname || ""}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="profile-field">
              <label>Last Name</label>
              <input
                name="lastname"
                value={profile.lastname || ""}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="profile-field">
              <label>Gender</label>
              <select
                name="gender"
                value={profile.gender || ""}
                onChange={handleChange}
                disabled={!isEditing}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="profile-field">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={profile.dob || ""}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="profile-field">
              <label>Nationality</label>
              <input
                name="nationality"
                value={profile.nationality || ""}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="profile-field">
              <label>Phone Number</label>
              <input
                name="phone_number"
                value={profile.phone_number || ""}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="profile-field">
              <label>City</label>
              <input
                name="city"
                value={profile.city || ""}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="profile-field">
              <label>State</label>
              <input
                name="state"
                value={profile.state || ""}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="profile-actions">
            {!isEditing ? (
              <>
                <button type="button" className="btn-primary" onClick={() => setIsEditing(true)}>
                  ✏️ Edit Profile
                </button>
                <button type="button" className="btn-secondary" onClick={() => navigate("/my-itineraries")}>
                  📋 My Itineraries
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-primary" onClick={handleSave}>
                  💾 Save Changes
                </button>
                <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
