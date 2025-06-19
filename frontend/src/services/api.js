// src/services/api.js
import axios from 'axios';

const API_BASE =  'https://cf-api-testing.onrender.com:5000/api/v1';

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
  getProfile: (id, params = {}) => 
    api.get(`/students/${id}/profile`, { params }),
  
  // Manual sync student data
  sync: (id) => api.post(`/students/${id}/sync`),
  
  // Export CSV
  exportCSV: () => api.get('/students/export/csv', { 
    responseType: 'blob' 
  })
};

export default api; 