import cron from 'node-cron';
import Student from '../models/Student.js';
import Submission from '../models/Submission.js';
import syncStudentData from './sync.js';
import { sendInactivityEmail } from './sendEmail.js';

// Store the current cron job
let currentCronJob = null;
let cronConfig = {
  time: '0 2 * * *', // Default: 2 AM daily
  frequency: 'daily',
  enabled: true,
  lastRun: null,
  nextRun: null
};

// Initialize cron job on server start
export function initializeCronJobs() {
  console.log('🕒 Initializing cron job system...');
  setupDailyCron();
  console.log(`✅ Cron job scheduled: ${cronConfig.time} (${cronConfig.frequency})`);
}

// Set up the daily cron job
export function setupDailyCron(cronTime = cronConfig.time) {
  try {
    // Stop existing cron job if running
    if (currentCronJob) {
      currentCronJob.stop();
      console.log('🛑 Stopped previous cron job');
    }

    // Validate cron expression
    if (!cron.validate(cronTime)) {
      throw new Error(`Invalid cron expression: ${cronTime}`);
    }

    // Create new cron job
    currentCronJob = cron.schedule(cronTime, async () => {
      console.log('🚀 Starting daily sync and inactivity check...');
      cronConfig.lastRun = new Date();
      
      try {
        await runDailyTasks();
        console.log('✅ Daily cron job completed successfully');
      } catch (error) {
        console.error('❌ Daily cron job failed:', error.message);
      }
    }, {
      scheduled: cronConfig.enabled,
      timezone: "UTC"
    });

    // Update config
    cronConfig.time = cronTime;
    cronConfig.nextRun = getNextCronRun(cronTime);
    
    console.log(`✅ Cron job configured: ${cronTime}`);
    return { success: true, message: 'Cron job configured successfully' };
    
  } catch (error) {
    console.error('❌ Failed to setup cron job:', error.message);
    return { success: false, error: error.message };
  }
}

// Main daily tasks function
async function runDailyTasks() {
  const startTime = Date.now();
  const stats = {
    totalStudents: 0,
    syncedSuccessfully: 0,
    syncErrors: 0,
    inactiveStudents: 0,
    emailsSent: 0,
    emailErrors: 0
  };

  try {
    // Get all students
    const students = await Student.find();
    stats.totalStudents = students.length;
    
    console.log(`📊 Processing ${students.length} students...`);

    // Process each student
    for (const student of students) {
      try {
        // 1. Sync student data
        console.log(`🔄 Syncing data for ${student.cfHandle}...`);
        const syncResult = await syncStudentData(student._id);
        
        if (syncResult.success) {
          stats.syncedSuccessfully++;
          console.log(`✅ Sync completed for ${student.cfHandle}`);
          
          // 2. Check for inactivity
          const isInactive = await checkStudentInactivity(student);
          
          if (isInactive) {
            stats.inactiveStudents++;
            
            // 3. Send email if enabled for this student
            if (student.emailEnabled) {
              console.log(`📧 Sending inactivity email to ${student.email}...`);
              const emailResult = await sendInactivityEmail(student);
              
              if (emailResult.success) {
                stats.emailsSent++;
                console.log(`✅ Email sent to ${student.email}`);
              } else {
                stats.emailErrors++;
                console.log(`❌ Email failed for ${student.email}: ${emailResult.error}`);
              }
            } else {
              console.log(`⏭️ Email disabled for ${student.name}`);
            }
          }
          
        } else {
          stats.syncErrors++;
          console.log(`❌ Sync failed for ${student.cfHandle}: ${syncResult.error}`);
        }
        
        // Add small delay to avoid overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        stats.syncErrors++;
        console.error(`❌ Error processing student ${student.cfHandle}:`, error.message);
      }
    }

    // Log final statistics
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`
📊 Daily Cron Job Complete (${duration}s):
   👥 Total Students: ${stats.totalStudents}
   ✅ Synced Successfully: ${stats.syncedSuccessfully}
   ❌ Sync Errors: ${stats.syncErrors}
   😴 Inactive Students: ${stats.inactiveStudents}
   📧 Emails Sent: ${stats.emailsSent}
   📧 Email Errors: ${stats.emailErrors}
    `);

    return stats;

  } catch (error) {
    console.error('❌ Daily tasks failed:', error.message);
    throw error;
  }
}

// Check if student is inactive (no submissions in last 7 days)
async function checkStudentInactivity(student) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSubmissions = await Submission.find({
      studentId: student._id,
      timestamp: { $gte: sevenDaysAgo }
    }).limit(1);

    const isInactive = recentSubmissions.length === 0;
    
    if (isInactive) {
      console.log(`😴 Student ${student.cfHandle} is inactive (no submissions in 7 days)`);
    }
    
    return isInactive;
    
  } catch (error) {
    console.error(`❌ Error checking inactivity for ${student.cfHandle}:`, error.message);
    return false;
  }
}

// Calculate next cron run time
function getNextCronRun(cronExpression) {
  try {
    // This is a simplified calculation - in production you'd use a proper cron parser
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // Default to 2 AM
    return tomorrow;
  } catch (error) {
    return null;
  }
}

// Manual trigger for testing
export async function triggerManualSync() {
  console.log('🔄 Manual sync triggered by admin');
  try {
    const stats = await runDailyTasks();
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get cron job status
export function getCronStatus() {
  return {
    ...cronConfig,
    isRunning: currentCronJob ? currentCronJob.running : false,
    uptime: cronConfig.lastRun ? Date.now() - cronConfig.lastRun.getTime() : null
  };
}

// Update cron configuration
export function updateCronConfig(newConfig) {
  try {
    if (newConfig.time && newConfig.time !== cronConfig.time) {
      const result = setupDailyCron(newConfig.time);
      if (!result.success) {
        return result;
      }
    }
    
    if (newConfig.enabled !== undefined) {
      cronConfig.enabled = newConfig.enabled;
      if (currentCronJob) {
        if (newConfig.enabled) {
          currentCronJob.start();
        } else {
          currentCronJob.stop();
        }
      }
    }
    
    return { success: true, config: cronConfig };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Stop all cron jobs (for server shutdown)
export function stopAllCronJobs() {
  if (currentCronJob) {
    currentCronJob.stop();
    console.log('🛑 All cron jobs stopped');
  }
}

export default {initializeCronJobs,setupDailyCron,triggerManualSync,getCronStatus,updateCronConfig,stopAllCronJobs};