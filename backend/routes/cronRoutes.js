import express from 'express';
import cron from 'node-cron';
import { initializeCronJobs, setupDailyCron, triggerManualSync,  getCronStatus, updateCronConfig} from '../utils/cronJobs.js';

const router = express.Router();

// Get current cron job status
router.get('/status', (req, res) => {
  try {
    const status = getCronStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Cron status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update cron job configuration
router.post('/configure', (req, res) => {
  try {
    const { time, enabled, frequency } = req.body;
    
    // Simple cron validation using node-cron
    if (time && !cron.validate(time)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cron expression. Example: "0 2 * * *" for daily at 2 AM'
      });
    }
    
    const result = updateCronConfig({ time, enabled, frequency });
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Cron job configuration updated successfully',
        config: result.config
      });
    } else {
      // Client error vs server error
      const statusCode = result.error && result.error.includes('Invalid') ? 400 : 500;
      res.status(statusCode).json(result);
    }
    
  } catch (error) {
    console.error('Cron configure error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Trigger manual sync (for testing)
router.post('/trigger', async (req, res) => {
  try {
    console.log('🔄 Manual sync triggered via API');
    const result = await triggerManualSync();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Manual sync completed successfully',
        stats: result.stats
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Manual sync failed'
      });
    }
    
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get predefined cron schedule options
router.get('/schedules', (req, res) => {
  const schedules = [
    { name: 'Every 2 AM', value: '0 2 * * *', description: 'Daily at 2:00 AM' },
    { name: 'Every 3 AM', value: '0 3 * * *', description: 'Daily at 3:00 AM' },
    { name: 'Every 4 AM', value: '0 4 * * *', description: 'Daily at 4:00 AM' },
    { name: 'Every 6 hours', value: '0 */6 * * *', description: 'Every 6 hours' },
    { name: 'Every 12 hours', value: '0 */12 * * *', description: 'Every 12 hours' },
    { name: 'Every minute (test)', value: '* * * * *', description: 'For testing only' }
  ];
  
  res.json({
    success: true,
    schedules
  });
});

export default router;