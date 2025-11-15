import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job', 
        required: true
    },
    applicantName: {
        type: String,
        required: true,
        trim: true
    },
    resumeLink: {
        type: String, 
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
