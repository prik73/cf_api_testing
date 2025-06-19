import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Moon, Sun, Users, TrendingUp, Trophy, RefreshCw, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { studentAPI } from '../../services/api';

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeToday: 0,
    avgRating: 0,
    needSync: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await studentAPI.getAll();
      const students = response.data;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const totalStudents = students.length;
      const activeToday = students.filter(student => {
        if (!student.lastSync) return false;
        const syncDate = new Date(student.lastSync);
        return syncDate >= today;
      }).length;
      
      const avgRating = students.length > 0 
        ? Math.round(students.reduce((sum, s) => sum + (s.currentRating || 0), 0) / students.length)
        : 0;
        
      const needSync = students.filter(student => {
        if (!student.lastSync) return true;
        const syncDate = new Date(student.lastSync);
        const hoursDiff = (now - syncDate) / (1000 * 60 * 60);
        return hoursDiff > 24; // Need sync if more than 24 hours
      }).length;

      setStats({ totalStudents, activeToday, avgRating, needSync });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleThemeToggle = () => {
    console.log('🎨 Theme toggle clicked:', theme, '→', theme === 'light' ? 'dark' : 'light');
    toggleTheme();
    
    // Force a visual update
    setTimeout(() => {
      const root = document.documentElement;
      console.log('🎨 After toggle - HTML classes:', root.className);
      console.log('🎨 Background color:', getComputedStyle(root).getPropertyValue('--background'));
    }, 100);
  };

  // Don't show stats on admin page
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* FIXED: Header with CSS variables */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white cursor-pointer"
                onClick={() => navigate('/')}
              >
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 
                  className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  Student Progress Hub
                </h1>
                <p className="text-sm text-muted-foreground">Track • Analyze • Excel</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              {/* Navigation Links */}
              <div className="flex items-center gap-2">
                <Button
                  variant={location.pathname === '/' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Students
                </Button>
                <Button
                  variant={location.pathname === '/admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                className="rounded-full relative"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4 transition-transform duration-300" />
                ) : (
                  <Sun className="h-4 w-4 transition-transform duration-300" />
                )}
                
                {/* Visual feedback */}
                <span className="sr-only">
                  {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards - Only show on main dashboard */}
      {!isAdminPage && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* FIXED: Total Students - Using CSS variables */}
            <div className="bg-card backdrop-blur-xl rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-card-foreground">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            {/* FIXED: Active Today - Using CSS variables */}
            <div className="bg-card backdrop-blur-xl rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold text-card-foreground">{stats.activeToday}</p>
                </div>
              </div>
            </div>

            {/* FIXED: Average Rating - Using CSS variables */}
            <div className="bg-card backdrop-blur-xl rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold text-card-foreground">{stats.avgRating}</p>
                </div>
              </div>
            </div>

            {/* FIXED: Need Sync - Using CSS variables */}
            <div className="bg-card backdrop-blur-xl rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Need Sync</p>
                  <p className="text-2xl font-bold text-card-foreground">{stats.needSync}</p>
                </div>
              </div>
            </div>
          </div>

          {/* FIXED: Main Content Container - Using CSS variables */}
          <div className="bg-card backdrop-blur-xl rounded-xl border border-border min-h-[600px]">
            {children}
          </div>
        </div>
      )}

      {/* Direct Content for Admin Page */}
      {isAdminPage && (
        <div className="container mx-auto px-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default Layout;