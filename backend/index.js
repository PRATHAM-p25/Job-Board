import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import User from "./models/user.js";
import Admin from "./models/admin.js";
import Job from "./models/job.js";
import Application from "./models/application.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://aegon2528_db_user:aegon2528@cluster0.bvicjpy.mongodb.net/";
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing or invalid Authorization header." });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload._id && !payload.id) payload.id = payload._id;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
}

app.get("/", (_req, res) => res.send("Job Board API is live"));
app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));


app.post("/api/user/signup", async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!userName || !email || !password) return res.status(400).json({ success: false, message: "userName, email, password required" });

    const existing = await User.findOne({ $or: [{ userName: userName.trim() }, { email: email.toLowerCase().trim() }] });
    if (existing) return res.status(409).json({ success: false, message: "User exists" });

    const user = new User({ userName: userName.trim(), email: email.toLowerCase().trim(), password, role: "applicant" });
    await user.save();

    const payload = { id: user._id.toString(), role: "user", userName: user.userName };
    const token = createToken(payload);
    return res.status(201).json({ success: true, user: { id: payload.id, userName: user.userName, email: user.email, role: "user" }, token });
  } catch (err) {
    console.error("User signup error", err);
    return res.status(500).json({ success: false, message: "Server error during user signup" });
  }
});

app.post("/api/user/signin", async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) return res.status(400).json({ success: false, message: "userName and password required" });

    const user = await User.findOne({ userName: userName.trim() });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const payload = { id: user._id.toString(), role: "user", userName: user.userName };
    const token = createToken(payload);
    return res.status(200).json({ success: true, user: { id: payload.id, userName: user.userName, email: user.email, role: "user" }, token });
  } catch (err) {
    console.error("User signin error", err);
    return res.status(500).json({ success: false, message: "Server error during signin" });
  }
});

app.post("/api/admin/signup", async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!userName || !email || !password) return res.status(400).json({ success: false, message: "userName,email,password required" });

    const existing = await Admin.findOne({ $or: [{ userName: userName.trim() }, { email: email.toLowerCase().trim() }] });
    if (existing) return res.status(409).json({ success: false, message: "Admin exists" });

    const admin = new Admin({ userName: userName.trim(), email: email.toLowerCase().trim(), password });
    await admin.save();

    const payload = { id: admin._id.toString(), role: "admin", userName: admin.userName };
    const token = createToken(payload);
    return res.status(201).json({ success: true, user: { id: payload.id, userName: admin.userName, email: admin.email, role: "admin" }, token });
  } catch (err) {
    console.error("Admin signup error", err);
    return res.status(500).json({ success: false, message: "Server error during admin signup" });
  }
});

app.post("/api/admin/signin", async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) return res.status(400).json({ success: false, message: "userName and password required" });

    const admin = await Admin.findOne({ userName: userName.trim() });
    if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const payload = { id: admin._id.toString(), role: "admin", userName: admin.userName };
    const token = createToken(payload);
    return res.status(200).json({ success: true, user: { id: payload.id, userName: admin.userName, email: admin.email, role: "admin" }, token });
  } catch (err) {
    console.error("Admin signin error", err);
    return res.status(500).json({ success: false, message: "Server error during admin signin" });
  }
});


app.get("/api/jobs", async (_req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).populate({ path: "postedBy", select: "userName" }).lean();

    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await Application.countDocuments({ jobId: job._id });
        const postedByInfo = job.postedBy ? { id: job.postedBy._id?.toString() || job.postedBy, userName: job.postedBy.userName || null } : null;
        return { ...job, applicationsCount: count, postedBy: postedByInfo };
      })
    );

    return res.status(200).json({ success: true, jobs: jobsWithCounts });
  } catch (err) {
    console.error("Fetch jobs error", err);
    return res.status(500).json({ success: false, message: "Failed to fetch jobs." });
  }
});

app.post("/api/jobs", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { title, description, skills } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, message: "title and description required" });

    const skillsArray = typeof skills === "string" ? skills.split(",").map(s => s.trim()).filter(Boolean) : Array.isArray(skills) ? skills.map(s => String(s).trim()).filter(Boolean) : [];

    const job = new Job({
      title: String(title).trim(),
      description: String(description).trim(),
      skills: skillsArray,
      postedBy: req.user.id 
    });

    await job.save();

    const jobObj = job.toObject();
    jobObj.applicationsCount = 0;
    jobObj.postedBy = { id: req.user.id, userName: req.user.userName || null };

    return res.status(201).json({ success: true, job: jobObj });
  } catch (err) {
    console.error("Create job error", err);
    return res.status(500).json({ success: false, message: "Failed to create job." });
  }
});


app.post("/api/jobs/:id/apply", async (req, res) => {
  try {
    const jobId = req.params.id;
    const { applicantName, resumeLink } = req.body;
    if (!applicantName || !resumeLink) return res.status(400).json({ success: false, message: "applicantName and resumeLink required" });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    const application = new Application({ jobId, applicantName: String(applicantName).trim(), resumeLink: String(resumeLink).trim() });
    await application.save();

    const updatedCount = await Application.countDocuments({ jobId });
    return res.status(201).json({ success: true, application, applicationsCount: updatedCount });
  } catch (err) {
    console.error("Apply error", err);
    return res.status(500).json({ success: false, message: "Failed to apply" });
  }
});

app.get("/api/jobs/:id", async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId).populate({ path: "postedBy", select: "userName" }).lean();
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    const count = await Application.countDocuments({ jobId: job._id });
    job.applicationsCount = count;
    job.postedBy = job.postedBy ? { id: job.postedBy._id?.toString(), userName: job.postedBy.userName } : null;
    return res.status(200).json({ success: true, job });
  } catch (err) {
    console.error("Get job error", err);
    return res.status(500).json({ success: false, message: "Failed to fetch job" });
  }
});

app.put("/api/jobs/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    if (!job.postedBy || String(job.postedBy) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not owner" });
    }

    const { title, description, skills } = req.body;
    if (typeof title === "string") job.title = title.trim();
    if (typeof description === "string") job.description = description.trim();
    if (skills !== undefined) {
      job.skills = typeof skills === "string" ? skills.split(",").map(s => s.trim()).filter(Boolean) : Array.isArray(skills) ? skills.map(s => String(s).trim()).filter(Boolean) : [];
    }

    await job.save();
    const count = await Application.countDocuments({ jobId: job._id });
    const jobObj = job.toObject();
    jobObj.applicationsCount = count;
    jobObj.postedBy = { id: job.postedBy?.toString(), userName: req.user.userName || null };

    return res.status(200).json({ success: true, job: jobObj });
  } catch (err) {
    console.error("Update job error", err);
    return res.status(500).json({ success: false, message: "Failed to update job" });
  }
});

app.delete("/api/jobs/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    if (!job.postedBy || String(job.postedBy) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not owner" });
    }

    await Job.findByIdAndDelete(jobId);
    await Application.deleteMany({ jobId });
    return res.status(200).json({ success: true, message: "Job and applications deleted" });
  } catch (err) {
    console.error("Delete job error", err);
    return res.status(500).json({ success: false, message: "Failed to delete job" });
  }
});

app.get("/api/jobs/:id/applications", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    if (!job.postedBy || String(job.postedBy) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not owner" });
    }

    const applications = await Application.find({ jobId }).sort({ appliedAt: -1 }).lean();
    return res.status(200).json({ success: true, applications });
  } catch (err) {
    console.error("Get applications error", err);
    return res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
});

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
