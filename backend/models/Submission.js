import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  cfSubmissionId: { type: Number, required: true },
  contestId: { type: Number },
  problem: {
    name: String,
    rating: Number,
    tags: [String]
  },
  verdict: String,
  timestamp: { type: Date, required: true },
  programmingLanguage: String
});

const Submission =  mongoose.model('Submission', submissionSchema);

export default Submission