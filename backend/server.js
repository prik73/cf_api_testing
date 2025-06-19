const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-progress', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  cfHandle: { type: String, required: true, unique: true },
  currentRating: { type: Number, default: 0 },
  maxRating: { type: Number, default: 0 },
  lastSync: { type: Date, default: null },
  emailEnabled: { type: Boolean, default: true },
  emailCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// Submission Schema
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

const Submission = mongoose.model('Submission', submissionSchema);

// Contest Participation Schema
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

// Codeforces API Helper
class CodeforcesAPI {
  static async getUserInfo(handle) {
    try {
      const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user info for ${handle}:`, error.message);
      throw error;
    }
  }

  static async getUserSubmissions(handle) {
    try {
      const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching submissions for ${handle}:`, error.message);
      throw error;
    }
  }

  static async getUserRating(handle) {
    try {
      const response = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching rating for ${handle}:`, error.message);
      throw error;
    }
  }

  static async getContestList() {
    try {
      const response = await axios.get('https://codeforces.com/api/contest.list');
      return response.data;
    } catch (error) {
      console.error('Error fetching contest list:', error.message);
      throw error;
    }
  }
}

// Sync student data from Codeforces
async function syncStudentData(studentId) {
  try {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    console.log(`Syncing data for ${student.cfHandle}...`);

    // Get user info and rating
    const userInfo = await CodeforcesAPI.getUserInfo(student.cfHandle);
    if (userInfo.status === 'OK') {
      const user = userInfo.result[0];
      student.currentRating = user.rating || 0;
      student.maxRating = user.maxRating || 0;
    }

    // Get submissions
    const submissions = await CodeforcesAPI.getUserSubmissions(student.cfHandle);
    if (submissions.status === 'OK') {
      // Clear old submissions for this student
      await Submission.deleteMany({ studentId: student._id });

      // Insert new submissions
      const submissionData = submissions.result.map(sub => ({
        studentId: student._id,
        cfSubmissionId: sub.id,
        contestId: sub.contestId,
        problem: {
          name: sub.problem.name,
          rating: sub.problem.rating,
          tags: sub.problem.tags
        },
        verdict: sub.verdict,
        timestamp: new Date(sub.creationTimeSeconds * 1000),
        programmingLanguage: sub.programmingLanguage
      }));

      await Submission.insertMany(submissionData);
    }

    // Get contest history
    const ratingHistory = await CodeforcesAPI.getUserRating(student.cfHandle);
    if (ratingHistory.status === 'OK') {
      // Clear old contest participations
      await ContestParticipation.deleteMany({ studentId: student._id });

      // Insert new contest participations
      const contestData = ratingHistory.result.map(contest => ({
        studentId: student._id,
        contestId: contest.contestId,
        contestName: contest.contestName,
        rank: contest.rank,
        oldRating: contest.oldRating,
        newRating: contest.newRating,
        ratingChange: contest.newRating - contest.oldRating,
        timestamp: new Date(contest.ratingUpdateTimeSeconds * 1000)
      }));

      await ContestParticipation.insertMany(contestData);
    }

    student.lastSync = new Date();
    await student.save();

    console.log(`✅ Sync completed for ${student.cfHandle}`);
    return { success: true, message: 'Sync completed successfully' };

  } catch (error) {
    console.error('Sync error:', error.message);
    return { success: false, error: error.message };
  }
}

// Routes

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new student
app.post('/api/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();

    // Immediately sync data for new student
    const syncResult = await syncStudentData(student._id);
    
    res.status(201).json({ student, syncResult });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update student
app.put('/api/students/:id', async (req, res) => {
  try {
    const oldStudent = await Student.findById(req.params.id);
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // If CF handle changed, sync immediately
    if (oldStudent.cfHandle !== student.cfHandle) {
      const syncResult = await syncStudentData(student._id);
      return res.json({ student, syncResult });
    }
    
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete student
app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ studentId: req.params.id });
    await ContestParticipation.deleteMany({ studentId: req.params.id });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get student profile data
app.get('/api/students/:id/profile', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    // Get contest history
    const contestHistory = await ContestParticipation.find({
      studentId: req.params.id,
      timestamp: { $gte: dateLimit }
    }).sort({ timestamp: -1 });

    // Get submissions
    const submissions = await Submission.find({
      studentId: req.params.id,
      timestamp: { $gte: dateLimit }
    }).sort({ timestamp: -1 });

    // Calculate statistics
    const acceptedSubmissions = submissions.filter(sub => sub.verdict === 'OK');
    const totalProblems = acceptedSubmissions.length;
    const avgRating = totalProblems > 0 
      ? acceptedSubmissions.reduce((sum, sub) => sum + (sub.problem.rating || 0), 0) / totalProblems 
      : 0;
    
    const mostDifficult = acceptedSubmissions.reduce((max, sub) => 
      (sub.problem.rating || 0) > (max.problem?.rating || 0) ? sub : max, {});

    // Problems per day
    const daysDiff = Math.max(1, Math.ceil((new Date() - dateLimit) / (1000 * 60 * 60 * 24)));
    const avgProblemsPerDay = totalProblems / daysDiff;

    // Rating buckets
    const ratingBuckets = {};
    acceptedSubmissions.forEach(sub => {
      const rating = sub.problem.rating || 0;
      const bucket = Math.floor(rating / 100) * 100;
      ratingBuckets[bucket] = (ratingBuckets[bucket] || 0) + 1;
    });

    res.json({
      student,
      contestHistory,
      statistics: {
        totalProblems,
        avgRating: Math.round(avgRating),
        avgProblemsPerDay: Math.round(avgProblemsPerDay * 100) / 100,
        mostDifficult: mostDifficult.problem || null,
        ratingBuckets
      },
      submissions: submissions.slice(0, 50) // Limit for performance
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual sync endpoint
app.post('/api/students/:id/sync', async (req, res) => {
  try {
    const result = await syncStudentData(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CSV export endpoint
app.get('/api/students/export/csv', async (req, res) => {
  try {
    const students = await Student.find();
    
    let csv = 'Name,Email,Phone,CF Handle,Current Rating,Max Rating,Last Sync\n';
    students.forEach(student => {
      csv += `"${student.name}","${student.email}","${student.phone}","${student.cfHandle}",${student.currentRating},${student.maxRating},"${student.lastSync || 'Never'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cron job for daily sync (runs at 2 AM)
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 Starting daily sync at 2 AM...');
  
  try {
    const students = await Student.find();
    
    for (const student of students) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
      await syncStudentData(student._id);
      
      // Check for inactivity (no submissions in last 7 days)
      const recentSubmissions = await Submission.find({
        studentId: student._id,
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });
      
      if (recentSubmissions.length === 0 && student.emailEnabled) {
        console.log(`📧 Sending inactivity email to ${student.email}`);
        student.emailCount += 1;
        await student.save();
        // TODO: Send actual email here
      }
    }
    
    console.log('✅ Daily sync completed');
  } catch (error) {
    console.error('❌ Daily sync failed:', error.message);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📊 Student Progress Management System Backend');
});