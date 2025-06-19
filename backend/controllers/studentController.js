import Student from '../models/Student.js'
import  syncStudentData  from '../utils/sync.js'
import Submission from '../models/Submission.js'
import ContestParticipation from '../models/ContestParticipation.js'
import  {getUserInfo}  from '../utils/codeforcesAPI.js'
import { body, validationResult } from 'express-validator';


export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// export const createStudent = async (req, res) => {
//   try {
//     const { name, email, phone, cfHandle } = req.body;

//     // Check if student already exists (by handle or email)
//     const existing = await Student.findOne({ cfHandle });
//     if (existing) {
//       return res.status(409).json({ error: 'Student with this handle already exists' });
//     }

//     // Validate handle
//     const userInfo = await getUserInfo(cfHandle);
//     if (userInfo.status !== 'OK') {
//       return res.status(400).json({ error: userInfo.comment });
//     }

//     const student = new Student({ name, email, phone, cfHandle });
//     await student.save();

//     const syncResult = await syncStudentData(student._id);
//     res.status(201).json({ student, syncResult });

//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };
export const createStudent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { name, email, phone, cfHandle } = req.body;

    // Check if student already exists (by handle or email)
    const existingHandle = await Student.findOne({ cfHandle });
    if (existingHandle) {
      return res.status(409).json({ error: 'Student with this Codeforces handle already exists' });
    }

    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: 'Student with this email already exists' });
    }

    // Validate Codeforces handle
    const userInfo = await getUserInfo(cfHandle);
    if (userInfo.status !== 'OK') {
      return res.status(400).json({ 
        error: 'Invalid Codeforces handle', 
        details: userInfo.comment || 'Handle not found' 
      });
    }

    // Create new student
    const student = new Student({ name, email, phone, cfHandle });
    await student.save();

    // Sync Codeforces data
    const syncResult = await syncStudentData(student._id);
    
    res.status(201).json({ 
      student, 
      syncResult,
      message: 'Student created successfully' 
    });

  } catch (error) {
    console.error('Error creating student:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        error: `Student with this ${field} already exists` 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Validation rules - export this to use in your routes
export const createStudentValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('phone')
    .trim()
    .matches(/^[\+]?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Please provide a valid phone number (10-15 digits)'),
    
  body('cfHandle')
    .trim()
    .isLength({ min: 3, max: 24 })
    .withMessage('Codeforces handle must be between 3 and 24 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Codeforces handle can only contain letters, numbers, and underscores')
];

export const updateStudent = async (req, res) => {
  try {
    // ADD: Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    
    const oldStudent = await Student.findById(id);
    if (!oldStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // ADD: Validate CF handle if being changed
    if (req.body.cfHandle && req.body.cfHandle !== oldStudent.cfHandle) {
      const userInfo = await getUserInfo(req.body.cfHandle);
      if (userInfo.status !== 'OK') {
        return res.status(400).json({ 
          error: 'Invalid Codeforces handle', 
          details: userInfo.comment || 'Handle not found' 
        });
      }
    }
    
    const student = await Student.findByIdAndUpdate(id, req.body, { new: true });
    if (!student) {
      return res.status(500).json({ error: 'Update failed' });
    }
    
    let syncResult = null;
    if (req.body.cfHandle && oldStudent.cfHandle !== req.body.cfHandle) {
      syncResult = await syncStudentData(student._id);
    }
    
    // ENHANCED: Better response with success message
    res.json({ 
      student, 
      syncResult,
      message: 'Student updated successfully' 
    });
   
  } catch (error) {
    console.error('Update error:', error.message);
    
    // ADD: Better error handling for duplicates
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        error: `Another student with this ${field} already exists` 
      });
    }
    
    res.status(400).json({ error: error.message });
  }
};



export const deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ studentId: req.params.id });
    await ContestParticipation.deleteMany({ studentId: req.params.id });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const manualSync = async (req, res) => {
  try {
    const result = await syncStudentData(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const exportCSV = async (req, res) => {
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
};

export const getStudentProfile = async (req, res) => {
  try {
    const { contestDays = 30, problemDays = 30 } = req.query;
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log('🔍 Profile request:', { 
      studentId: req.params.id, 
      contestDays, 
      problemDays,
      contestDaysType: typeof contestDays,
      problemDaysType: typeof problemDays
    });

    // FIXED: Better handling of "All Time" filters
    // Convert string parameters to numbers, handle -1 as "all time"
    const contestDaysNum = contestDays === '-1' || contestDays === -1 ? -1 : parseInt(contestDays);
    const problemDaysNum = problemDays === '-1' || problemDays === -1 ? -1 : parseInt(problemDays);

    console.log('🔍 Converted params:', { contestDaysNum, problemDaysNum });

    // Contest History Filtering - FIXED All Time handling
    let contestHistory;
    if (contestDaysNum === -1) {
      console.log('📊 Getting ALL contest history (no date filter)');
      contestHistory = await ContestParticipation.find({
        studentId: req.params.id
      }).sort({ timestamp: -1 });
    } else {
      console.log(`📊 Getting contest history for last ${contestDaysNum} days`);
      const contestDateLimit = new Date();
      contestDateLimit.setDate(contestDateLimit.getDate() - contestDaysNum);
      
      contestHistory = await ContestParticipation.find({
        studentId: req.params.id,
        timestamp: { $gte: contestDateLimit }
      }).sort({ timestamp: -1 });
    }

    // Problem Solving Data Filtering - FIXED All Time handling  
    let submissions;
    if (problemDaysNum === -1) {
      console.log('📊 Getting ALL submissions (no date filter)');
      submissions = await Submission.find({
        studentId: req.params.id
      }).sort({ timestamp: -1 });
    } else {
      console.log(`📊 Getting submissions for last ${problemDaysNum} days`);
      const problemDateLimit = new Date();
      problemDateLimit.setDate(problemDateLimit.getDate() - problemDaysNum);

      submissions = await Submission.find({
        studentId: req.params.id,
        timestamp: { $gte: problemDateLimit }
      }).sort({ timestamp: -1 });
    }

    console.log('📊 Data counts:', { 
      contestHistory: contestHistory.length, 
      submissions: submissions.length 
    });

    // Enhanced Statistics (rest of your existing code...)
    const acceptedSubmissions = submissions.filter(sub => sub.verdict === 'OK');
    const uniqueProblems = new Set(acceptedSubmissions.map(sub => 
      `${sub.contestId}-${sub.problem.name}`)).size;
    
    const avgRating = acceptedSubmissions.length > 0 
      ? acceptedSubmissions.reduce((sum, sub) => sum + (sub.problem.rating || 0), 0) / acceptedSubmissions.length 
      : 0;
    
    const mostDifficult = acceptedSubmissions.reduce((max, sub) => 
      (sub.problem.rating || 0) > (max.problem?.rating || 0) ? sub : max, {});

    // Submission Heatmap Data
    const heatmapData = {};
    submissions.forEach(sub => {
      const date = sub.timestamp.toISOString().split('T')[0];
      heatmapData[date] = (heatmapData[date] || 0) + 1;
    });

    // Rating Buckets
    const ratingBuckets = {};
    acceptedSubmissions.forEach(sub => {
      const rating = sub.problem.rating || 0;
      const bucket = Math.floor(rating / 100) * 100;
      ratingBuckets[bucket] = (ratingBuckets[bucket] || 0) + 1;
    });

    // Average problems per day - FIXED calculation for All Time
    let daysDiff;
    if (problemDaysNum === -1) {
      // For "All Time", calculate from student creation date
      const studentCreated = new Date(student.createdAt);
      daysDiff = Math.max(1, Math.ceil((Date.now() - studentCreated) / (1000 * 60 * 60 * 24)));
    } else {
      daysDiff = Math.max(1, problemDaysNum);
    }
    const avgProblemsPerDay = uniqueProblems / daysDiff;

    res.json({
      student,
      contestHistory: contestHistory.map(contest => ({
        ...contest.toObject(),
        unsolvedProblems: 0 // TODO: Calculate from contest data
      })),
      statistics: {
        totalProblems: uniqueProblems,
        avgRating: Math.round(avgRating),
        avgProblemsPerDay: Math.round(avgProblemsPerDay * 100) / 100,
        mostDifficult: mostDifficult.problem || null,
        ratingBuckets,
        heatmapData
      },
      submissions: submissions.slice(0, 100) // Limit to last 100 for performance
    });

  } catch (error) {
    console.error('❌ Profile load error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update email settings
const updateEmailSettings = async (req, res) => {
  try {
    const { emailEnabled } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id, 
      { emailEnabled }, 
      { new: true }
    );
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get email statistics
const getEmailStats = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    res.json({
      emailCount: student.emailCount,
      emailEnabled: student.emailEnabled,
      lastSync: student.lastSync
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  getStudentProfile,
  updateEmailSettings,
  getEmailStats
};