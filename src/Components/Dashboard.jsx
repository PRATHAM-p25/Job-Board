import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminPanel, { AdminActions } from "./Admin";
import UserActions from "./User";
import "./Dashboard.css";

const API_BASE = "http://localhost:5000/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const stored = localStorage.getItem("currentUser");
  const currentUser = stored ? JSON.parse(stored) : null;

  useEffect(() => {
    if (!currentUser) navigate("/auth");
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const isUser = currentUser?.role === "user" || currentUser?.role === "applicant";

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [applyMessage, setApplyMessage] = useState("");

  const fetchJobs = async () => {
    setLoadingJobs(true);
    setErrorMsg("");
    try {
      const res = await axios.get(`${API_BASE}/jobs`);
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Fetch jobs error:", err);
      setErrorMsg("Failed to load jobs. Ensure backend is running.");
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleJobCreated = (job) => {
    setJobs((prev) => [job, ...prev]);
  };

  const handleJobUpdated = (job) => {
    setJobs((prev) => prev.map((j) => (String(j._id || j.id) === String(job._id || job.id) ? job : j)));
  };

  const handleJobDeleted = (jobId) => {
    setJobs((prev) => prev.filter((j) => String(j._id || j.id) !== String(jobId)));
  };

  const handleApplied = (jobId, newCount = null) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (String(j._id || j.id) === String(jobId)) {
          const prevCount = typeof j.applicationsCount === "number" ? j.applicationsCount : (typeof j.applications === "number" ? j.applications : 0);
          return {
            ...j,
            applicationsCount: newCount !== null ? newCount : prevCount + 1,
            appliedByCurrentUser: true
          };
        }
        return j;
      })
    );
    setApplyMessage("Application submitted!");
    setTimeout(() => setApplyMessage(""), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/auth");
  };

  function isOwnerOfJob(job) {
    if (!currentUser) return false;
    const posted = job.postedBy ?? job.postedById ?? job.owner ?? null;
    if (!posted) return false;
    const postedId =
      typeof posted === "object" && (posted._id || posted.id)
        ? (posted._id || posted.id)
        : posted;
    const curId = currentUser.id || currentUser._id || currentUser.userName;
    return String(postedId) === String(curId);
  }

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="logo">Job Board</h1>
          <div className="user-info">
            Logged in as: <strong>{currentUser?.userName || currentUser?.name || "Unknown"}</strong>{" "}
            <span className="role">({currentUser?.role})</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchJobs}>
            Refresh
          </button>
          <button className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {isAdmin && (
          <aside className="admin-panel">
            <AdminPanel onJobCreated={handleJobCreated} />
          </aside>
        )}

        <section className="jobs-area">
          <h2 className="section-title">Available Jobs</h2>

          {loadingJobs ? (
            <div className="center">Loading jobs…</div>
          ) : errorMsg ? (
            <div className="error">{errorMsg}</div>
          ) : jobs.length === 0 ? (
            <div className="center">No jobs posted yet.</div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => {
                const jobId = job._id || job.id;
                const count = job.applicationsCount ?? job.applications ?? 0;
                const owner = isOwnerOfJob(job);
                const applied = !!job.appliedByCurrentUser;

                return (
                  <article key={jobId} className="job-card">
                    <div className="job-card-header">
                      <h3 className="job-title">{job.title}</h3>
                      <div className="job-date">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ""}</div>
                    </div>

                    <div className="job-meta">
                      <div className="posted-by">Posted by: <em>{(job.postedBy && (job.postedBy.userName || job.postedBy)) || "(unknown)"}</em></div>
                      <div className="skills">Skills: {Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills || "—")}</div>
                    </div>

                    <p className="job-desc">{job.description}</p>

                    <div className="job-actions">
                      {isUser && (
                        <UserActions
                          jobId={jobId}
                          applied={applied}
                          onApplied={(newCount) => handleApplied(jobId, newCount)}
                        />
                      )}

                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div className="applications-count">Applications: <strong>{count}</strong></div>

                        {isAdmin && owner && (
                          <AdminActions
                            job={job}
                            onJobUpdated={handleJobUpdated}
                            onJobDeleted={handleJobDeleted}
                            onFetchApplications={async (jobIdToFetch) => {
                              return [];
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {applyMessage && <div className="toast">{applyMessage}</div>}
    </div>
  );
}
