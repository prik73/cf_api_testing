// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import StudentProfile from './pages/StudentProfile';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Layout>
            <Routes>
              {/* Dashboard - Main student table */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Student profile page */}
              <Route path="/student/:id" element={<StudentProfile />} />
              
              {/* Redirect any unknown routes to dashboard */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Layout>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;