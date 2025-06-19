// REPLACE the entire sendEmail.js with this version that uses lazy loading:

import nodemailer from 'nodemailer';
import Student from '../models/Student.js';

// REMOVE the immediate initialization - use lazy loading instead
let emailTransporter = null;

// Create email transporter - ONLY when first called
const createEmailTransporter = () => {
  console.log('🔍 Email credentials check:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? `✅ Set (${process.env.EMAIL_USER.length} chars)` : '❌ Missing');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `✅ Set (${process.env.EMAIL_PASS.length} chars)` : '❌ Missing');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ Email credentials not configured in .env file');
    return null;
  }

  try {
    console.log('🔧 Creating Gmail transporter...');
    const transporter = nodemailer.createTransport  ({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

// Lazy getter - creates transporter only when needed
const getEmailTransporter = () => {
  if (!emailTransporter) {
    emailTransporter = createEmailTransporter();
  }
  return emailTransporter;
};

// Verify email connection
export const verifyEmailConnection = async () => {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log('📧 Email transporter not available');
    return false;
  }

  try {
    console.log('🔍 Testing email connection...');
    await transporter.verify();
    console.log('✅ Email connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email verification failed:', error.message);
    return false;
  }
};

// Send inactivity reminder email
export async function sendInactivityEmail(student) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log(`📧 Email service not available, skipping email to ${student.email}`);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: '🚀 Time to get back to problem solving!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">🎓 Student Progress Hub</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Keep up the momentum!</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Hi ${student.name}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6;">
              We noticed you haven't submitted any solutions in the past <strong>7 days</strong>. 
              Don't let your coding skills get rusty! 💪
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333;">📊 Your Progress</h3>
              <p style="margin: 5px 0;"><strong>Current Rating:</strong> ${student.currentRating || 'Unrated'}</p>
              <p style="margin: 5px 0;"><strong>Max Rating:</strong> ${student.maxRating || 'Unrated'}</p>
              <p style="margin: 5px 0;"><strong>Codeforces Handle:</strong> ${student.cfHandle}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://codeforces.com/problemset" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                🔥 Start Solving Problems
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; text-align: center;">
              Keep coding, keep growing! 🌱<br>
              - Student Progress Management Team
            </p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Inactivity email sent to ${student.email}`);
    
    // Update email count
    await Student.findByIdAndUpdate(student._id, {
      $inc: { emailCount: 1 }
    });
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error(`❌ Failed to send email to ${student.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Send welcome email for new students
export async function sendWelcomeEmail(student) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log('📧 Email service not available, skipping welcome email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: '🎉 Welcome to Student Progress Hub!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">🎓 Welcome to Progress Hub!</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Hi ${student.name}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Welcome to the Student Progress Management System! We're excited to help you track your coding journey.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">📋 Your Account Details</h3>
              <p><strong>Name:</strong> ${student.name}</p>
              <p><strong>Email:</strong> ${student.email}</p>
              <p><strong>Codeforces Handle:</strong> ${student.cfHandle}</p>
            </div>
            
            <p style="color: #666;">
              Your progress will be automatically synced daily. Happy coding! 🚀
            </p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${student.email}`);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${student.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Export the getter function instead of the transporter directly
export const getTransporter = getEmailTransporter;

// Export both named and default exports
export default { 
  sendInactivityEmail, 
  sendWelcomeEmail, 
  verifyEmailConnection,
  getTransporter
};