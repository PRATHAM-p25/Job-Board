import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export default function UserActions({ jobId, applied = false, onApplied }) {
  const [resumeLink, setResumeLink] = useState("");
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (!resumeLink.trim()) {
      alert("Please enter resume link.");
      return;
    }
    setApplying(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        applicantName: currentUser?.userName || currentUser?.name || "Anonymous",
        resumeLink: resumeLink.trim()
      };

      const res = await axios.post(`${API_BASE}/jobs/${jobId}/apply`, payload);
      if (res.data && res.data.success) {
        const newCount = typeof res.data.applicationsCount === "number" ? res.data.applicationsCount : null;
        onApplied && onApplied(newCount);
        setResumeLink("");
      } else {
        alert(res.data?.message || "Failed to apply.");
      }
    } catch (err) {
      console.error("Apply error:", err);
      alert(err?.response?.data?.message || "Failed to apply.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="apply-block" style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        type="text"
        placeholder="Resume link"
        value={resumeLink}
        onChange={(e) => setResumeLink(e.target.value)}
        className="input small"
        style={{ minWidth: 200 }}
      />
      <button
        className={`btn ${applied ? "btn-disabled" : "btn-apply"}`}
        onClick={handleApply}
        disabled={applying || applied}
      >
        {applying ? "Applying..." : applied ? "Applied" : "Apply"}
      </button>
    </div>
  );
}
