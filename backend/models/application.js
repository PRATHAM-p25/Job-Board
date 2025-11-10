/**
 * Mongoose Schema for Job Applications (ES Module).
 * Defines the structure for user submissions and links them to a specific job post.
 */
import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
    // Link the application to a specific job post
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job', // Reference the Job model
        required: true
    },
    applicantName: {
        type: String,
        required: true,
        trim: true
    },
    resumeLink: {
        type: String, // Storing the URL to the external resume
        required: true,
        trim: true
    },
    appliedAt: {
        type: Date,
        default: Date.now
    }
});

const Application = mongoose.model('Application', ApplicationSchema);
export default Application;