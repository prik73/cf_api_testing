import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Calendar, Trophy, TrendingUp, Target } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import toast from 'react-hot-toast';
import { studentAPI } from '../services/api';
import ContestHistory from '../components/Profile/ContestHistory';
import ProblemStats from '../components/Profile/ProblemStats';
import { formatDistanceToNow } from 'date-fns';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [contestDays, setContestDays] = useState(30);
  const [problemDays, setProblemDays] = useState(30);

  useEffect(() => {
    loadProfile();
  }, [id, contestDays, problemDays]);

const loadProfile = async () => {
  try {
    setLoading(true);
    
    console.log('🔍 Loading profile with filters:', { 
      id, 
      contestDays, 
      problemDays,
      contestDaysType: typeof contestDays,
      problemDaysType: typeof problemDays
    });
    
    // Handle "All Time" filter (-1) by not sending contestDays/problemDays params
    const params = {};
    if (contestDays !== -1) {
      params.contestDays = contestDays;
    }
    if (problemDays !== -1) {
      params.problemDays = problemDays;
    }
    
    console.log('🔍 API params being sent:', params);
    
    const response = await studentAPI.getProfile(id, params);
    
    console.log('🔍 API response:', {
      contestHistoryCount: response.data.contestHistory?.length || 0,
      submissionsCount: response.data.submissions?.length || 0,
      totalProblems: response.data.statistics?.totalProblems || 0
    });
    
    setStudent(response.data.student);
    setProfileData(response.data);
  } catch (error) {
    console.error('❌ Profile load error:', error);
    toast.error('Failed to load student profile');
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  console.log('🔍 Filter state changed:', { contestDays, problemDays });
  loadProfile();
}, [id, contestDays, problemDays]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await studentAPI.sync(id);
      await loadProfile();
      toast.success('Student data synced successfully');
    } catch (error) {
      toast.error('Failed to sync student data');
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 2100) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (rating >= 1900) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    if (rating >= 1600) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (rating >= 1400) return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
    if (rating >= 1200) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Student not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <Button
          onClick={handleSync}
          disabled={syncing}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {/* Student Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <p className="text-muted-foreground">{student.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline">{student.cfHandle}</Badge>
                <Badge className={getRatingColor(student.currentRating || 0)}>
                  Current: {student.currentRating || 'Unrated'}
                </Badge>
                <Badge variant="secondary">
                  Max: {student.maxRating || 'Unrated'}
                </Badge>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last Sync</p>
              <p className="text-sm font-medium">
                {student.lastSync 
                  ? formatDistanceToNow(new Date(student.lastSync), { addSuffix: true })
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {profileData?.statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Problems</p>
                  <p className="text-xl font-bold">{profileData.statistics.totalProblems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-xl font-bold">{profileData.statistics.avgRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Per Day</p>
                  <p className="text-xl font-bold">{profileData.statistics.avgProblemsPerDay}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Trophy className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hardest Solved</p>
                  <p className="text-xl font-bold">
                    {profileData.statistics.mostDifficult?.rating || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contest History */}
        <ContestHistory
          data={profileData?.contestHistory || []}
          contestDays={contestDays}
          onFilterChange={setContestDays}
          loading={loading}
        />

        {/* Problem Solving Stats */}
        <ProblemStats
          data={profileData?.statistics || {}}
          problemDays={problemDays}
          onFilterChange={setProblemDays}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default StudentProfile;