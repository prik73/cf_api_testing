import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const ContestHistory = ({ data, contestDays, onFilterChange, loading }) => {
  const filterOptions = [
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
    { value: 365, label: '365 Days' },
    { value: -1, label: 'All Time' }
  ];

  // FIXED: Proper event handling to prevent reload
  const handleFilterChange = (value, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log('Filter changed to:', value); // Debug log
    onFilterChange(value);
  };

  // Rest of your existing code for charts and rendering...
  const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  const chartData = sortedData.map((contest, index) => ({
    ...contest,
    x: index + 1,
    date: format(new Date(contest.timestamp), 'MMM dd'),
    rating: contest.newRating,
    oldRating: contest.oldRating
  }));

  const getRatingChangeColor = (change) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getRatingChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contest History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
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
            <Calendar className="h-5 w-5" />
            Contest History ({data.length} contests)
          </CardTitle>
          
          {/* FIXED: Proper button event handling */}
          <div className="flex gap-1">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                type="button" // Explicitly set type to prevent form submission
                variant={contestDays === option.value ? 'default' : 'outline'}
                size="sm"
                className="px-3 py-1"
                onClick={(e) => handleFilterChange(option.value, e)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Debug info */}
        <p className="text-xs text-muted-foreground">
          Current filter: {contestDays === -1 ? 'All Time' : `${contestDays} days`} | 
          Data count: {data.length}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Your existing chart and list code... */}
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickMargin={8}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickMargin={8}
                  domain={['dataMin - 50', 'dataMax + 50']}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-lg">
                          <p className="font-medium">{data.contestName}</p>
                          <p className="text-sm text-muted-foreground">{format(new Date(data.timestamp), 'MMM dd, yyyy')}</p>
                          <p className="text-sm">Rating: {data.newRating}</p>
                          <p className="text-sm">Rank: {data.rank}</p>
                          <p className={`text-sm flex items-center gap-1 ${getRatingChangeColor(data.ratingChange)}`}>
                            {getRatingChangeIcon(data.ratingChange)}
                            Change: {data.ratingChange > 0 ? '+' : ''}{data.ratingChange}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rating" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#2563eb', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No contest history for selected period</p>
              <p className="text-xs mt-1">Try selecting "All Time" to see all contests</p>
            </div>
          </div>
        )}

        {/* Contest List */}
        <div className="space-y-3">
          <h4 className="font-medium">Recent Contests</h4>
          
          {data.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.slice(0, 10).map((contest, index) => (
                <div 
                  key={contest.contestId || index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/25 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{contest.contestName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(contest.timestamp), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">Rank: {contest.rank}</p>
                      <p className="text-xs text-muted-foreground">
                        Rating: {contest.oldRating} → {contest.newRating}
                      </p>
                    </div>
                    
                    <Badge 
                      variant={contest.ratingChange >= 0 ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      {getRatingChangeIcon(contest.ratingChange)}
                      {contest.ratingChange > 0 ? '+' : ''}{contest.ratingChange}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No contests found for the selected period</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContestHistory;