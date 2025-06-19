import mongoose from "mongoose";

const contestParticipationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  contestId: { type: Number, required: true },
  contestName: String,
  rank: Number,
  oldRating: Number,
  newRating: Number,
  ratingChange: Number,
  timestamp: Date
});

const ContestParticipation = mongoose.model('ContestParticipation', contestParticipationSchema);

export default ContestParticipation;