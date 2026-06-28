import React, { useState } from "react";
import "./AiDayCard.css";

export default function AiDayCard({ 
  dayPlan, 
  weatherData, 
  onEditActivity, 
  onDeleteActivity, 
  onAddActivity, 
  onMoveActivity, 
  onRegenerateDay,
  onEditDayTitle,
  isRegenerating 
}) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTime, setEditTime] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTime, setNewTime] = useState("Afternoon");
  const [editingDayTitle, setEditingDayTitle] = useState(false);
  const [dayTitleEdit, setDayTitleEdit] = useState("");

  const editable = !!onEditActivity;

  const startEdit = (idx, activity) => {
    setEditingIdx(idx);
    setEditTitle(activity.title);
    setEditDesc(activity.description);
    setEditTime(activity.time);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    onEditActivity(dayPlan.day, editingIdx, {
      time: editTime,
      title: editTitle,
      description: editDesc
    });
    setEditingIdx(null);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddActivity(dayPlan.day, {
      time: newTime,
      title: newTitle.trim(),
      description: newDesc.trim() || "Enjoy this activity."
    });
    setAddingNew(false);
    setNewTitle("");
    setNewDesc("");
    setNewTime("Afternoon");
  };

  const startEditDayTitle = () => {
    setEditingDayTitle(true);
    setDayTitleEdit(dayPlan.title);
  };

  const saveDayTitle = () => {
    if (dayTitleEdit.trim() && onEditDayTitle) {
      onEditDayTitle(dayPlan.day, dayTitleEdit.trim());
    }
    setEditingDayTitle(false);
  };

  return (
    <div className={`timeline-item ai-timeline-item ${isRegenerating ? "regenerating" : ""}`}>
      <div className="timeline-marker">
        <div className="timeline-dot ai-dot"></div>
        <div className="timeline-line"></div>
      </div>
      
      <div className="timeline-content bento-widget ai-day-card">
        <div className="day-header ai-day-header">
          <div className="day-info">
            {editingDayTitle ? (
              <div className="day-title-edit-row">
                <span className="day-num-label">Day {dayPlan.day}:</span>
                <input
                  className="day-title-input"
                  value={dayTitleEdit}
                  onChange={(e) => setDayTitleEdit(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveDayTitle(); if (e.key === "Escape") setEditingDayTitle(false); }}
                  autoFocus
                />
                <button className="ai-btn-sm save" onClick={saveDayTitle}>✓</button>
                <button className="ai-btn-sm cancel" onClick={() => setEditingDayTitle(false)}>✕</button>
              </div>
            ) : (
              <h3 
                className={editable ? "editable-title" : ""}
                onClick={editable ? startEditDayTitle : undefined}
                title={editable ? "Click to edit day title" : ""}
              >
                Day {dayPlan.day}: {dayPlan.title}
              </h3>
            )}
            <span className="day-date">{dayPlan.date}</span>
          </div>
          <div className="day-header-right">
            {weatherData && (
              <div className="day-weather">
                <span>{Math.round(weatherData.main.temp)}°C</span>
                <img src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`} alt="Weather icon" />
              </div>
            )}
            {editable && onRegenerateDay && (
              <button 
                className="regen-day-btn"
                onClick={() => onRegenerateDay(dayPlan.day, dayPlan.date)}
                disabled={isRegenerating}
                title="Regenerate this day"
              >
                {isRegenerating ? "⟳" : "🔄"}
              </button>
            )}
          </div>
        </div>
        
        <div className="ai-activities">
          {dayPlan.activities?.map((act, idx) => (
            <div key={idx} className={`ai-activity ${editingIdx === idx ? "editing" : ""}`}>
              {editingIdx === idx ? (
                <div className="ai-activity-edit">
                  <select className="ai-edit-time" value={editTime} onChange={(e) => setEditTime(e.target.value)}>
                    <option value="Early Morning">Early Morning</option>
                    <option value="Morning">Morning</option>
                    <option value="Late Morning">Late Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Late Afternoon">Late Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                  <input 
                    className="ai-edit-title" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Activity title"
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                    autoFocus
                  />
                  <textarea 
                    className="ai-edit-desc" 
                    value={editDesc} 
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description"
                    rows={2}
                  />
                  <div className="ai-edit-actions">
                    <button className="ai-btn-sm save" onClick={saveEdit}>Save</button>
                    <button className="ai-btn-sm cancel" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ai-act-time">{act.time}</div>
                  <div className="ai-act-details">
                    <h4 
                      className={editable ? "editable-text" : ""}
                      onClick={editable ? () => startEdit(idx, act) : undefined}
                      title={editable ? "Click to edit" : ""}
                    >
                      {act.title}
                    </h4>
                    <p 
                      className={editable ? "editable-text" : ""}
                      onClick={editable ? () => startEdit(idx, act) : undefined}
                    >
                      {act.description}
                    </p>
                  </div>
                  {editable && (
                    <div className="ai-act-controls">
                      <button
                        className="ai-ctrl-btn move"
                        onClick={() => onMoveActivity(dayPlan.day, idx, "up")}
                        disabled={idx === 0}
                        title="Move up"
                      >↑</button>
                      <button
                        className="ai-ctrl-btn move"
                        onClick={() => onMoveActivity(dayPlan.day, idx, "down")}
                        disabled={idx === dayPlan.activities.length - 1}
                        title="Move down"
                      >↓</button>
                      <button
                        className="ai-ctrl-btn delete"
                        onClick={() => onDeleteActivity(dayPlan.day, idx)}
                        title="Remove activity"
                      >✕</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add Activity */}
        {editable && (
          <div className="ai-add-section">
            {addingNew ? (
              <div className="ai-add-form">
                <select className="ai-edit-time" value={newTime} onChange={(e) => setNewTime(e.target.value)}>
                  <option value="Early Morning">Early Morning</option>
                  <option value="Morning">Morning</option>
                  <option value="Late Morning">Late Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Late Afternoon">Late Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
                <input
                  className="ai-edit-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Activity title"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAddingNew(false); }}
                  autoFocus
                />
                <textarea
                  className="ai-edit-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                />
                <div className="ai-edit-actions">
                  <button className="ai-btn-sm save" onClick={handleAdd}>Add</button>
                  <button className="ai-btn-sm cancel" onClick={() => setAddingNew(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="ai-add-btn" onClick={() => setAddingNew(true)}>
                + Add Activity
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
