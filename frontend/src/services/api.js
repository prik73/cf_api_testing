import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Student API endpoints matching your backend
export const studentAPI = {
  // Get all students for the table
  getAll: () => api.get('/students'),
  
  // Create new student
  create: (data) => api.post('/students', data),
  
  // Update existing student
  update: (id, data) => api.put(`/students/${id}`, data),
  
  // Delete student
  delete: (id) => api.delete(`/students/${id}`),
  
  // Get student profile with filtering
  getProfile: (id, params = {}) => {
    console.log('🔍 API client getProfile called with:', { id, params });
    
    // Clean up parameters - remove undefined values and handle -1 properly
    const cleanParams = {};
    
    if (params.contestDays !== undefined && params.contestDays !== null) {
      if (params.contestDays === -1) {
        // For "All Time", send -1 explicitly
        cleanParams.contestDays = -1;
      } else {
        cleanParams.contestDays = params.contestDays;
      }
    }
    
    if (params.problemDays !== undefined && params.problemDays !== null) {
      if (params.problemDays === -1) {
        // For "All Time", send -1 explicitly  
        cleanParams.problemDays = -1;
      } else {
        cleanParams.problemDays = params.problemDays;
      }
    }
    
    console.log('🔍 API client sending clean params:', cleanParams);
    
    return api.get(`/students/${id}/profile`, { params: cleanParams });
  },
  
  // Manual sync student data
  sync: (id) => api.post(`/students/${id}/sync`),
  
  // Export CSV
  exportCSV: () => api.get('/students/export/csv', { 
    responseType: 'blob' 
  })
};

// Email API endpoints
export const emailAPI = {
  // Get email system status
  getStatus: () => api.get('/email/status'),
  
  // Send test email to student
  sendTestEmail: (studentId) => 
    api.post(`/email/student/${studentId}/test`),
  
  // Update email settings for student
  updateEmailSettings: (studentId, emailEnabled) =>
    api.put(`/email/student/${studentId}/settings`, { emailEnabled }),
  
  // Get email stats for student
  getEmailStats: (studentId) => 
    api.get(`/email/student/${studentId}/stats`),
  
  // Get all students with email settings
  getAllStudentsEmailSettings: () => api.get('/email/students')
};

// Cron API endpoints
export const cronAPI = {
  // Get cron job status
  getStatus: () => api.get('/cron/status'),
  
  // Configure cron schedule
  configure: (config) => api.post('/cron/configure', config),
  
  // Trigger manual sync
  triggerManualSync: () => api.post('/cron/trigger'),
  
  // Get available schedules
  getSchedules: () => api.get('/cron/schedules')
};

export default api;