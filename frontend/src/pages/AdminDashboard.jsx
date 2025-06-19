import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Settings, RefreshCw, Mail, Clock, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { cronAPI, emailAPI, studentAPI } from '../services/api';

const AdminDashboard = () => {
  const [cronStatus, setCronStatus] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [cronRes, emailRes, studentsRes] = await Promise.all([
        cronAPI.getStatus(),
        emailAPI.getStatus(),
        studentAPI.getAll()
      ]);

      setCronStatus(cronRes.data.status);
      setEmailStatus(emailRes.data.status);
      
      // Calculate system stats
      const students = studentsRes.data;
      setSystemStats({
        totalStudents: students.length,
        emailEnabledCount: students.filter(s => s.emailEnabled).length,
        recentSyncs: students.filter(s => {
          if (!s.lastSync) return false;
          const syncDate = new Date(s.lastSync);
          const hoursDiff = (Date.now() - syncDate.getTime()) / (1000 * 60 * 60);
          return hoursDiff <= 24;
        }).length
      });
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setTriggering(true);
      const response = await cronAPI.triggerManualSync();
      if (response.data.success) {
        toast.success('Manual sync completed successfully');
        await loadDashboardData(); // Refresh data
      } else {
        toast.error('Manual sync failed');
      }
    } catch (error) {
      console.error('Manual sync error:', error);
      toast.error('Failed to trigger manual sync');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        
        <Button 
          onClick={handleManualSync} 
          disabled={triggering || cronStatus?.isRunning}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${triggering ? 'animate-spin' : ''}`} />
          {triggering ? 'Syncing...' : 'Manual Sync All'}
        </Button>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats?.emailEnabledCount || 0} with email enabled
            </p>
          </CardContent>
        </Card>

        {/* Email System */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email System</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={emailStatus?.connected ? 'default' : 'destructive'}>
                {emailStatus?.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {emailStatus?.totalEmailsSent || 0} emails sent total
            </p>
          </CardContent>
        </Card>

        {/* Cron Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cron Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={cronStatus?.enabled ? 'default' : 'secondary'}>
                {cronStatus?.enabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Schedule: {cronStatus?.schedule || 'Not set'}
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Syncs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.recentSyncs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Synced in last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cron Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cron Job Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <Badge variant={cronStatus?.enabled ? 'default' : 'secondary'}>
                {cronStatus?.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Schedule:</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {cronStatus?.schedule || 'Not set'}
              </code>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Last Run:</span>
              <span className="text-sm text-muted-foreground">
                {cronStatus?.lastRun ? new Date(cronStatus.lastRun).toLocaleString() : 'Never'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Running:</span>
              <Badge variant={cronStatus?.isRunning ? 'default' : 'secondary'}>
                {cronStatus?.isRunning ? 'Yes' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Email System Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Connection:</span>
              <Badge variant={emailStatus?.connected ? 'default' : 'destructive'}>
                {emailStatus?.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Service:</span>
              <span className="text-sm">{emailStatus?.emailService || 'Not configured'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Email Enabled:</span>
              <span className="text-sm">
                {emailStatus?.emailEnabledCount || 0} / {emailStatus?.totalStudents || 0} students
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Total Sent:</span>
              <span className="text-sm font-medium">
                {emailStatus?.totalEmailsSent || 0} emails
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => window.location.href = '/'} variant="outline">
              View Students
            </Button>
            <Button onClick={loadDashboardData} variant="outline">
              Refresh Dashboard
            </Button>
            <Button 
              onClick={handleManualSync} 
              disabled={triggering || cronStatus?.isRunning}
              variant="outline"
            >
              {triggering ? 'Syncing...' : 'Sync All Students'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;