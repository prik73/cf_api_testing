import express from 'express';
import Student from '../models/Student.js';
import { sendInactivityEmail, verifyEmailConnection } from '../utils/sendEmail.js';

const emailRouter = express.Router();

// Update email settings for a specific student
emailRouter.put('/student/:id/settings', async (req, res) => {
  try {
    const { emailEnabled } = req.body;
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { emailEnabled: emailEnabled },
      { new: true }
    );
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      message: `Email notifications ${emailEnabled ? 'enabled' : 'disabled'} for ${student.name}`,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        emailEnabled: student.emailEnabled,
        emailCount: student.emailCount
      }
    });
    
  } catch (error) {
    console.error('Email settings update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get email statistics for a student
emailRouter.get('/student/:id/stats', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      stats: {
        emailCount: student.emailCount || 0,
        emailEnabled: student.emailEnabled,
        lastSync: student.lastSync,
        name: student.name,
        email: student.email
      }
    });
    
  } catch (error) {
    console.error('Email stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send test email to a student
emailRouter.post('/student/:id/test', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    const result = await sendInactivityEmail(student);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Test email sent successfully to ${student.email}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get email system status
emailRouter.get('/status', async (req, res) => {
  try {
    const isConnected = await verifyEmailConnection();
    
    // Get email statistics
    const totalStudents = await Student.countDocuments();
    const emailEnabledCount = await Student.countDocuments({ emailEnabled: true });
    const totalEmailsSent = await Student.aggregate([
      { $group: { _id: null, total: { $sum: '$emailCount' } } }
    ]);
    
    res.json({
      success: true,
      status: {
        connected: isConnected,
        totalStudents,
        emailEnabledCount,
        emailDisabledCount: totalStudents - emailEnabledCount,
        totalEmailsSent: totalEmailsSent[0]?.total || 0,
        emailService: process.env.EMAIL_USER ? 'Configured' : 'Not configured'
      }
    });
    
  } catch (error) {
    console.error('Email status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get list of students with email settings
emailRouter.get('/students', async (req, res) => {
  try {
    const students = await Student.find()
      .select('name email emailEnabled emailCount lastSync')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      students: students.map(student => ({
        id: student._id,
        name: student.name,
        email: student.email,
        emailEnabled: student.emailEnabled,
        emailCount: student.emailCount || 0,
        lastSync: student.lastSync
      }))
    });
    
  } catch (error) {
    console.error('Email students list error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { emailRouter };