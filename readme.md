# # Student Progress Management System
**Live Demo**: https://tle.prik.dev
## Product Overview

A MERN stack web application for tracking competitive programming progress on Codeforces. Features automated data synchronization, email notifications, and comprehensive analytics dashboard.

## Core Implementation

### Automated Data Synchronization

**Backend Implementation** (`backend/utils/cronJobs.js`):
- Daily cron job runs at 2 AM UTC (configurable)
- Processes all students sequentially with API rate limiting
- Fetches latest Codeforces data: user info, submissions, contest history
- Updates local database with new data

**How it works**:

```javascript
// Main daily sync function
async function runDailyTasks() {
  const students = await Student.find();
  for (const student of students) {
    await syncStudentData(student._id);  // Individual sync
    await checkStudentInactivity(student);  // Check 7-day activity
    if (inactive && emailEnabled) {
      await sendInactivityEmail(student);  // Send notification
    }
  }
}
```
Admin Access: Navigate to /admin → View cron status, trigger manual sync, configure schedule

### Inactivity Detection & Email Notifications
Backend Logic (backend/utils/cronJobs.js line 85-105):

```javascript
// Checks if student has no submissions in last 7 days
async function checkStudentInactivity(student) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentSubmissions = await Submission.find({
    studentId: student._id,
    timestamp: { $gte: sevenDaysAgo }
  }).limit(1);
  
  return recentSubmissions.length === 0;
}
```
###  Email Service (backend/utils/sendEmail.js):


- Gmail SMTP integration with HTML templates
- Individual email controls per student
- Email count tracking

### Frontend Access: Main dashboard → Email toggle switches, send test emails


## Admin Dashboard Monitoring

### Backend Routes (backend/routes/cronRoutes.js, backend/routes/emailRoutes.js):

- /api/v1/cron/status - System health, last run, next scheduled run
- /api/v1/email/status - Email service status, total emails sent
- /api/v1/cron/trigger - Manual sync all students

### Frontend Interface (frontend/src/pages/AdminDashboard.jsx):

- Real-time system status cards
- Cron job configuration
- Manual sync controls
- Email system monitoring

## Analytics Dashboard
## Contest History with Rating Graphs
_Backend Implementation (backend/controllers/studentController.js lines 180-220):_

```javascript
// Filters contest data by time period
if (contestDays !== -1) {
  const contestDateLimit = new Date();
  contestDateLimit.setDate(contestDateLimit.getDate() - contestDays);
  
  contestHistory = await ContestParticipation.find({
    studentId: req.params.id,
    timestamp: { $gte: contestDateLimit }
  }).sort({ timestamp: -1 });
} else {
  // All time - no date filter
  contestHistory = await ContestParticipation.find({
    studentId: req.params.id
  }).sort({ timestamp: -1 });
}
```

### Frontend Display (frontend/src/components/Profile/ContestHistory.jsx):

- Interactive line charts using Recharts
- Filter buttons: 30 Days, 90 Days, 365 Days, All Time
- Rating change indicators and contest details

### Problem Solving Statistics & Heatmaps
#### Backend Analytics (backend/controllers/studentController.js lines 240-280):

- Rating bucket analysis (groups problems by difficulty)
- Submission heatmap data generation
- Average problems per day calculation
- Most difficult problem solved tracking

Frontend Visualization (frontend/src/components/Profile/ProblemStats.jsx):

- Bar charts for rating distribution
- GitHub-style submission heatmap
- Key statistics display

### Time Period Filtering (30/90/365 days, All Time)
#### Current Implementation:

- Frontend sends filter parameters: ?contestDays=30&problemDays=7
- Backend processes date ranges for data filtering
- Special handling for contestDays=-1 (All Time)

## known Issue - "All Time" Filter:
```javascript
// Problem area in frontend parameter passing
const params = {};
if (contestDays !== -1) params.contestDays = contestDays;  // All Time not sent correctly
if (problemDays !== -1) params.problemDays = problemDays;

// Backend expects -1 explicitly for All Time
const contestDaysNum = contestDays === '-1' || contestDays === -1 ? -1 : parseInt(contestDays);
```
### Current Status:
- 30/90/365 day filters work correctly
- "All Time" filter partially implemented but not reliably loading complete historical data
- Issue appears to be in parameter passing between frontend components and API calls

### API Endpoints
#### Student Management
```
GET    /api/v1/students                           # List all students
POST   /api/v1/students                           # Create student (validates CF handle)
GET    /api/v1/students/:id/profile               # Get analytics with time filters
POST   /api/v1/students/:id/sync                  # Manual data sync
```

#### System Administration
```
GET    /api/v1/cron/status                        # Cron job status and statistics
POST   /api/v1/cron/trigger                       # Trigger immediate sync
POST   /api/v1/cron/configure                     # Update cron schedule
GET    /api/v1/email/status                       # Email system health
PUT    /api/v1/email/student/:id/settings         # Toggle email notifications
```

### Example API Response

``` json
GET /api/v1/students/123/profile?contestDays=30

{
  "student": {
    "name": "John Doe",
    "cfHandle": "johndoe",
    "currentRating": 1650,
    "maxRating": 1820
  },
  "contestHistory": [
    {
      "contestName": "Codeforces Round #123",
      "rank": 456,
      "ratingChange": +42,
      "timestamp": "2024-06-15T10:00:00Z"
    }
  ],
  "statistics": {
    "totalProblems": 89,
    "avgRating": 1342,
    "avgProblemsPerDay": 2.1,
    "mostDifficult": { "name": "Problem D", "rating": 2100 }
  }
}
```
### Navigation & Access
- Main Dashboard (/): Student management, search, email controls
- Student Profile (/student/:id): Detailed analytics, contest history, problem stats
- Admin Panel (/admin): System monitoring, cron management, email status

### Implementation Notes:

All data synced from Codeforces API with error handling
Email notifications use Gmail SMTP with HTML templates
Charts and visualizations built with Recharts library
Responsive design works across desktop/tablet/mobile(it's a joke, for now only responsive for desktop :) )