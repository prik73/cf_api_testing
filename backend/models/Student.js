import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  cfHandle: { type: String, unique: true },
  currentRating: Number,
  maxRating: Number,
  lastSync: Date,
  emailEnabled: { type: Boolean, default: true },
  emailCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Student =  mongoose.model('Student', studentSchema);
export default Student
