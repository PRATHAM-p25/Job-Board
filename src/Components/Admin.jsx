import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminPanel({ onJobCreated }) {
  const [newJob, setNewJob] = useState({ title: "", description: "", skills: "" });
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewJob((p) => ({ ...p, [name]: value }));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    const { title, description, skills } = newJob;
    if (!title || !description || !skills) {
      setMsg("Please fill title, description and skills.");
      return;
    }
    setPosting(true);
    setMsg("");
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const postedBy = currentUser?.id || currentUser?._id || currentUser?.userName || null;

      const payload = {
        title: title.trim(),
        description: description.trim(),
        skills: typeof skills === "string" ? skills.split(",").map(s => s.trim()).filter(Boolean) : skills,
        ...(postedBy ? { postedBy } : {})
      };

      const res = await axios.post(`${API_BASE}/jobs`, payload, { headers: authHeaders() });
      if (res.data && res.data.success) {
        const job = res.data.job;
        onJobCreated && onJobCreated(job);
        setNewJob({ title: "", description: "", skills: "" });
        setMsg("Job posted.");
      } else {
        setMsg(res.data?.message || "Failed to post.");
      }
    } catch (err) {
      console.error("Admin post job error:", err);
      setMsg(err?.response?.data?.message || "Server error while posting job.");
    } finally {
      setPosting(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <div className="card admin-card">
      <h3 className="card-title">Post a New Job</h3>
      <form onSubmit={handlePost} className="post-form">
        <input name="title" value={newJob.title} onChange={handleChange} placeholder="Job Title" className="input" />
        <textarea name="description" value={newJob.description} onChange={handleChange} placeholder="Job Description" className="textarea" />
        <input name="skills" value={newJob.skills} onChange={handleChange} placeholder="Skills (comma separated)" className="input" />
        <button type="submit" className="btn btn-primary" disabled={posting}>
          {posting ? "Posting..." : "Post Job"}
        </button>
        {msg && <div className="form-msg">{msg}</div>}
      </form>
    </div>
  );
}

export function AdminActions({ job, onJobUpdated, onJobDeleted }) {
  const jobId = job._id || job.id;

  async function handleEdit() {
    const title = prompt("Title", job.title);
    if (title === null) return;
    const description = prompt("Description", job.description);
    if (description === null) return;
    const skillsDefault = Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "";
    const skills = prompt("Skills (comma separated)", skillsDefault);
    try {
      const res = await axios.put(`${API_BASE}/jobs/${jobId}`, { title, description, skills }, { headers: authHeaders() });
      if (res.data && res.data.success) {
        onJobUpdated && onJobUpdated(res.data.job);
        alert("Job updated.");
      } else {
        alert(res.data?.message || "Update failed.");
      }
    } catch (err) {
      console.error("Update job error:", err);
      alert(err?.response?.data?.message || "Failed to update job.");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this job and all its applications?")) return;
    try {
      const res = await axios.delete(`${API_BASE}/jobs/${jobId}`, { headers: authHeaders() });
      if (res.data && res.data.success) {
        onJobDeleted && onJobDeleted(jobId);
        alert("Job deleted.");
      } else {
        alert(res.data?.message || "Delete failed.");
      }
    } catch (err) {
      console.error("Delete job error:", err);
      alert(err?.response?.data?.message || "Failed to delete job.");
    }
  }

  async function handleViewApplications() {
    try {
      const res = await axios.get(`${API_BASE}/jobs/${jobId}/applications`, { headers: authHeaders() });
      if (res.data && res.data.success) {
        const apps = res.data.applications || [];
        const text = apps.length ? apps.map(a => `${a.applicantName} — ${a.resumeLink}`).join("\n") : "No applications";
        alert(text);
      } else {
        alert(res.data?.message || "Failed to fetch applications.");
      }
    } catch (err) {
      console.error("Fetch applications error:", err);
      alert(err?.response?.data?.message || "Failed to fetch applications.");
    }
  }

  return (
    <div className="admin-actions" style={{ display: "flex", gap: 8 }}>
      <button className="btn btn-outline" onClick={handleEdit}>Edit</button>
      <button className="btn btn-logout" onClick={handleDelete}>Delete</button>
      <button className="btn btn-outline" onClick={handleViewApplications}>View Applications</button>
    </div>
  );
}

