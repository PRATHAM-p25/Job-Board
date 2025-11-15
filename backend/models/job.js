import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  skills: { type: [String], required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }, 
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

JobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'jobId',
  count: true
});

const Job = mongoose.model('Job', JobSchema);
export default Job;
