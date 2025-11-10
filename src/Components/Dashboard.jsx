/*import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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

  const [newJob, setNewJob] = useState({ title: "", description: "", skills: "" });
  const [posting, setPosting] = useState(false);
  const [postMessage, setPostMessage] = useState("");

  const [resumeLinks, setResumeLinks] = useState({}); 

  const [applyingId, setApplyingId] = useState(null);

  const [applyMessage, setApplyMessage] = useState("");

  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

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

  const handleNewJobChange = (e) => {
    const { name, value } = e.target;
    setNewJob((p) => ({ ...p, [name]: value }));
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    const { title, description, skills } = newJob;
    if (!title || !description || !skills) {
      setPostMessage("Fill title, description and skills.");
      return;
    }
    setPosting(true);
    setPostMessage("");

    try {
      const res = await axios.post(
        `${API_BASE}/jobs`,
        { title, description, skills },
        { headers: authHeaders() }
      );
      if (res.data.success) {
        setJobs((p) => [res.data.job, ...p]);
        setNewJob({ title: "", description: "", skills: "" });
        setPostMessage("Job posted!");
      } else {
        setPostMessage(res.data.message || "Failed to post.");
      }
    } catch (err) {
      console.error("Post job error:", err);
      setPostMessage(err?.response?.data?.message || "Failed to post job.");
    } finally {
      setPosting(false);
      setTimeout(() => setPostMessage(""), 3000);
    }
  };

  const setResumeLinkForJob = (jobId, value) => {
    setResumeLinks((prev) => ({ ...prev, [jobId]: value }));
  };

  const getResumeLinkForJob = (jobId) => {
    return resumeLinks[jobId] ?? "";
  };

  const handleApply = async (jobId) => {
    const resumeLink = (resumeLinks[jobId] || "").trim();
    if (!resumeLink) {
      alert("Please enter a resume link for this job.");
      return;
    }

    setApplyingId(jobId);
    setApplyMessage("");
    try {
      const payload = {
        applicantName: currentUser?.userName || currentUser?.name || "Anonymous",
        resumeLink,
      };

      const res = await axios.post(`${API_BASE}/jobs/${jobId}/apply`, payload);
      if (res.data.success) {
        const serverCount = typeof res.data.applicationsCount === "number" ? res.data.applicationsCount : null;

        setJobs((prev) =>
          prev.map((j) => {
            if (String(j._id || j.id) === String(jobId)) {
              const prevCount = typeof j.applicationsCount === "number" ? j.applicationsCount : 0;
              return {
                ...j,
                applicationsCount: serverCount !== null ? serverCount : prevCount + 1,
                appliedByCurrentUser: true,
              };
            }
            return j;
          })
        );

        setResumeLinks((prev) => {
          const copy = { ...prev };
          delete copy[jobId];
          return copy;
        });

        setApplyMessage("Application submitted!");
      } else {
        setApplyMessage("Failed to apply.");
      }
    } catch (err) {
      console.error("Apply error:", err);
      setApplyMessage(err?.response?.data?.message || "Failed to apply.");
    } finally {
      setApplyingId(null);
      setTimeout(() => setApplyMessage(""), 3000);
    }
  };

  async function fetchApplications(jobId) {
    try {
      const res = await axios.get(`${API_BASE}/jobs/${jobId}/applications`, { headers: authHeaders() });
      if (res.data.success) return res.data.applications || [];
    } catch (err) {
      console.error("Fetch applications error", err);
    }
    return [];
  }

  async function handleDeleteJob(jobId) {
    if (!confirm("Delete this job and all its applications?")) return;
    try {
      const res = await axios.delete(`${API_BASE}/jobs/${jobId}`, { headers: authHeaders() });
      if (res.data.success) {
        setJobs((prev) => prev.filter((j) => String(j._id || j.id) !== String(jobId)));
        alert("Job deleted.");
      } else {
        alert(res.data.message || "Delete failed.");
      }
    } catch (err) {
      console.error("Delete job error", err);
      alert(err?.response?.data?.message || "Failed to delete job.");
    }
  }

  async function handleEditJob(jobId) {
    const job = jobs.find((j) => String(j._id || j.id) === String(jobId));
    if (!job) return alert("Job not found in UI.");
    const title = prompt("Title", job.title);
    if (title === null) return;
    const description = prompt("Description", job.description);
    if (description === null) return;
    const skills = prompt("Skills (comma separated)", Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "");
    try {
      const res = await axios.put(
        `${API_BASE}/jobs/${jobId}`,
        { title, description, skills },
        { headers: authHeaders() }
      );
      if (res.data.success) {
        setJobs((prev) => prev.map((j) => (String(j._id || j.id) === String(jobId) ? res.data.job : j)));
        alert("Job updated.");
      } else {
        alert(res.data.message || "Update failed.");
      }
    } catch (err) {
      console.error("Update job error", err);
      alert(err?.response?.data?.message || "Failed to update job.");
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/auth");
  };

  function isOwnerOfJob(job) {
    if (!currentUser) return false;
    const posted = job.postedBy;
    if (!posted) return false;
    const postedId = posted.id ?? posted._id ?? posted;
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
          <button className="btn btn-outline" onClick={fetchJobs}>Refresh</button>
          <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        {isAdmin && (
          <aside className="admin-panel">
            <div className="card admin-card">
              <h3 className="card-title">Post a New Job</h3>
              <form onSubmit={handlePostJob} className="post-form">
                <input name="title" value={newJob.title} onChange={handleNewJobChange} placeholder="Job Title" className="input" />
                <textarea name="description" value={newJob.description} onChange={handleNewJobChange} placeholder="Job Description" className="textarea" />
                <input name="skills" value={newJob.skills} onChange={handleNewJobChange} placeholder="Skills (comma separated)" className="input" />
                <button type="submit" className="btn btn-primary" disabled={posting}>{posting ? "Posting..." : "Post Job"}</button>
                {postMessage && <div className="form-msg">{postMessage}</div>}
              </form>
            </div>
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
                      <div className="posted-by">Posted by: <em>{job.postedBy?.userName || "(unknown)"}</em></div>
                      <div className="skills">Skills: {Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills || "—")}</div>
                    </div>

                    <p className="job-desc">{job.description}</p>

                    <div className="job-actions">
                      {isUser && (
                        <div className="apply-block">
                          <input
                            type="text"
                            placeholder="Resume link"
                            value={getResumeLinkForJob(jobId)}
                            onChange={(e) => setResumeLinkForJob(jobId, e.target.value)}
                            className="input small"
                          />
                          <button
                            className={`btn ${applied ? "btn-disabled" : "btn-apply"}`}
                            onClick={() => handleApply(jobId)}
                            disabled={applyingId === jobId || applied}
                          >
                            {applyingId === jobId ? "Applying..." : applied ? "Applied" : "Apply"}
                          </button>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div className="applications-count">Applications: <strong>{count}</strong></div>

                        {isAdmin && owner && (
                          <div className="admin-actions" style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-outline" onClick={() => handleEditJob(jobId)}>Edit</button>
                            <button className="btn btn-logout" onClick={() => handleDeleteJob(jobId)}>Delete</button>
                            <button
                              className="btn btn-outline"
                              onClick={async () => {
                                const apps = await fetchApplications(jobId);
                                const text = apps.length ? apps.map(a => `${a.applicantName} — ${a.resumeLink}`).join("\n") : "No applications";
                                alert(text);
                              }}
                            >
                              View Applications
                            </button>
                          </div>
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
}*/


// src/Components/Dashboard.jsx
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
    // eslint-disable-next-line
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const isUser = currentUser?.role === "user" || currentUser?.role === "applicant";

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [applyMessage, setApplyMessage] = useState("");

  // Fetch jobs (with applicationsCount provided by backend)
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

  // Callbacks for Admin component to update UI
  const handleJobCreated = (job) => {
    // new job object returned by server (should include _id etc.)
    setJobs((prev) => [job, ...prev]);
  };

  const handleJobUpdated = (job) => {
    setJobs((prev) => prev.map((j) => (String(j._id || j.id) === String(job._id || job.id) ? job : j)));
  };

  const handleJobDeleted = (jobId) => {
    setJobs((prev) => prev.filter((j) => String(j._id || j.id) !== String(jobId)));
  };

  // Callback for User apply action
  // receives new count (may be null) — if null, increment locally
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

  // ownership helper used to decide whether to show admin action buttons
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
                              // AdminActions will call this, but it also handles fetching itself.
                              // Keep for compatibility — Dashboard doesn't need to do anything here.
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
