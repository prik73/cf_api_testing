import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Target, TrendingUp, Calendar, Trophy } from 'lucide-react';
import SubmissionHeatmap from './SubmissionHeatMap';

const ProblemStats = ({ data, problemDays, onFilterChange, loading }) => {
  const filterOptions = [
    { value: 7, label: '7 Days' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
    { value: -1, label: 'All Time' }
  ];

  // Prepare rating buckets data for bar chart
  const ratingBucketsData = Object.entries(data.ratingBuckets || {})
    .map(([rating, count]) => ({
      rating: `${rating}+`,
      count,
      ratingValue: parseInt(rating)
    }))
    .sort((a, b) => a.ratingValue - b.ratingValue);

  const getRatingColor = (rating) => {
    if (rating >= 2100) return '#dc2626'; // red
    if (rating >= 1900) return '#9333ea'; // purple
    if (rating >= 1600) return '#2563eb'; // blue
    if (rating >= 1400) return '#059669'; // emerald
    if (rating >= 1200) return '#16a34a'; // green
    return '#6b7280'; // gray
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Problem Solving Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Problem Solving Data
          </CardTitle>
          
          {/* Filter Buttons - FIXED to prevent page reload */}
          <div className="flex gap-1">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={problemDays === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFilterChange(option.value);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Most Difficult</p>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-orange-500" />
              <span className="font-bold">
                {data.mostDifficult?.rating || 'N/A'}
              </span>
              {data.mostDifficult?.name && (
                <Badge variant="outline" className="text-xs">
                  {data.mostDifficult.name}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="font-bold">{data.avgRating || 0}</span>
            </div>
          </div>
        </div>

        {/* Problems per Rating Bucket Bar Chart */}
        <div className="space-y-3">
          <h4 className="font-medium">Problems Solved by Rating</h4>
          
          {ratingBucketsData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingBucketsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="rating" 
                    tick={{ fontSize: 12 }}
                    tickMargin={8}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickMargin={8}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-lg">
                            <p className="font-medium">Rating {label}</p>
                            <p className="text-sm">Problems: {data.count}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="count"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No problems solved in selected period</p>
              </div>
            </div>
          )}
        </div>

        {/* Submission Heatmap */}
        <div className="space-y-3">
          <h4 className="font-medium">Submission Heatmap</h4>
          <SubmissionHeatmap data={data.heatmapData || {}} />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/25 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold">{data.totalProblems || 0}</p>
            <p className="text-sm text-muted-foreground">Total Problems</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold">{data.avgProblemsPerDay || 0}</p>
            <p className="text-sm text-muted-foreground">Problems/Day</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProblemStats;