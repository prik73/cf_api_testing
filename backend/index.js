import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors'

import connectDB from './config/db.js'
import studentRoutes from './routes/studentRoutes.js'
import cronRoutes from './routes/cronRoutes.js'
import { emailRouter } from './routes/emailRoutes.js';
import { initializeCronJobs, stopAllCronJobs } from './utils/cronJobs.js';
import { verifyEmailConnection } from './utils/sendEmail.js';



const app = express();


// Connect to DB
connectDB();
verifyEmailConnection();

// Middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'https://tle.prik.dev'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/cron', cronRoutes)
app.use('/api/v1/email', emailRouter)


app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    email: process.env.EMAIL_USER ? 'Configured' : 'Not configured',
    cronJobs: 'Active'
  });
});

// Initialize Cron Jobs
console.log('🕒 Initializing cron job system...');
initializeCronJobs();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  stopAllCronJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  stopAllCronJobs();
  process.exit(0);
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🕒 Cron jobs: ✅ Initialized`);
});
