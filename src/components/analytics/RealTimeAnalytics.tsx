import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  Users, 
  Eye, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { analyticsService } from '../../services/AnalyticsService';

interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

interface RealTimeEvent {
  id: string;
  timestamp: Date;
  type: string;
  description: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface ChartDataPoint {
  timestamp: string;
  activeUsers: number;
  pageViews: number;
  events: number;
}

export default function RealTimeAnalytics() {
  const [isActive, setIsActive] = useState(true);
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const eventCountRef = useRef(0);
  const activeUsersRef = useRef(new Set<string>());

  useEffect(() => {
    if (isActive) {
      startRealTimeTracking();
    } else {
      stopRealTimeTracking();
    }

    return () => stopRealTimeTracking();
  }, [isActive]);

  const startRealTimeTracking = () => {
    // Initialize metrics
    initializeMetrics();
    
    // Start polling for real-time data
    intervalRef.current = setInterval(() => {
      updateRealTimeData();
    }, 5000); // Update every 5 seconds

    // Listen for real-time events
    setupEventListeners();
  };

  const stopRealTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    removeEventListeners();
  };

  const initializeMetrics = () => {
    const initialMetrics: RealTimeMetric[] = [
      {
        id: 'active-users',
        name: 'Active Users',
        value: 0,
        change: 0,
        trend: 'stable',
        icon: <Users className="h-4 w-4" />,
        color: 'text-blue-600'
      },
      {
        id: 'page-views',
        name: 'Page Views',
        value: 0,
        change: 0,
        trend: 'stable',
        icon: <Eye className="h-4 w-4" />,
        color: 'text-green-600'
      },
      {
        id: 'events',
        name: 'Events/min',
        value: 0,
        change: 0,
        trend: 'stable',
        icon: <Activity className="h-4 w-4" />,
        color: 'text-purple-600'
      },
      {
        id: 'avg-session',
        name: 'Avg Session',
        value: 0,
        change: 0,
        trend: 'stable',
        icon: <Clock className="h-4 w-4" />,
        color: 'text-orange-600'
      }
    ];

    setMetrics(initialMetrics);
  };

  const updateRealTimeData = async () => {
    try {
      // Simulate real-time data updates
      const now = new Date();
      const activeUsers = Math.floor(Math.random() * 50) + 10;
      const pageViews = Math.floor(Math.random() * 100) + 20;
      const eventsPerMin = Math.floor(Math.random() * 200) + 50;
      const avgSession = Math.floor(Math.random() * 300) + 120; // seconds

      // Update metrics with trends
      setMetrics(prev => prev.map(metric => {
        let newValue = metric.value;
        let change = 0;
        let trend: 'up' | 'down' | 'stable' = 'stable';

        switch (metric.id) {
          case 'active-users':
            change = activeUsers - metric.value;
            newValue = activeUsers;
            break;
          case 'page-views':
            change = pageViews - metric.value;
            newValue = pageViews;
            break;
          case 'events':
            change = eventsPerMin - metric.value;
            newValue = eventsPerMin;
            break;
          case 'avg-session':
            change = avgSession - metric.value;
            newValue = avgSession;
            break;
        }

        if (change > 0) trend = 'up';
        else if (change < 0) trend = 'down';

        return {
          ...metric,
          value: newValue,
          change: Math.abs(change),
          trend
        };
      }));

      // Update chart data
      setChartData(prev => {
        const newData = [
          ...prev,
          {
            timestamp: now.toLocaleTimeString(),
            activeUsers,
            pageViews,
            events: eventsPerMin
          }
        ].slice(-20); // Keep last 20 data points

        return newData;
      });

      setLastUpdate(now);
    } catch (error) {
      console.error('Failed to update real-time data:', error);
    }
  };

  const setupEventListeners = () => {
    // Listen for custom analytics events
    const handleAnalyticsEvent = (event: CustomEvent) => {
      addRealTimeEvent({
        id: Date.now().toString(),
        timestamp: new Date(),
        type: event.detail.type || 'unknown',
        description: event.detail.description || 'Analytics event',
        userId: event.detail.userId,
        metadata: event.detail.metadata
      });
    };

    window.addEventListener('analytics-event', handleAnalyticsEvent as EventListener);

    // Simulate some real-time events
    const eventTypes = [
      { type: 'lesson_start', description: 'User started a lesson' },
      { type: 'lesson_complete', description: 'User completed a lesson' },
      { type: 'exercise_attempt', description: 'User attempted an exercise' },
      { type: 'page_view', description: 'User viewed a page' },
      { type: 'user_login', description: 'User logged in' },
      { type: 'user_logout', description: 'User logged out' }
    ];

    const simulateEvents = () => {
      if (isActive && Math.random() > 0.7) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        addRealTimeEvent({
          id: Date.now().toString(),
          timestamp: new Date(),
          type: eventType.type,
          description: eventType.description,
          userId: `user_${Math.floor(Math.random() * 1000)}`
        });
      }
    };

    const simulationInterval = setInterval(simulateEvents, 3000);

    return () => {
      window.removeEventListener('analytics-event', handleAnalyticsEvent as EventListener);
      clearInterval(simulationInterval);
    };
  };

  const removeEventListeners = () => {
    // Event listeners are cleaned up in setupEventListeners return function
  };

  const addRealTimeEvent = (event: RealTimeEvent) => {
    setEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
    eventCountRef.current++;
  };

  const resetData = () => {
    setMetrics([]);
    setEvents([]);
    setChartData([]);
    eventCountRef.current = 0;
    activeUsersRef.current.clear();
    initializeMetrics();
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatValue = (metric: RealTimeMetric) => {
    if (metric.id === 'avg-session') {
      return `${Math.floor(metric.value / 60)}:${(metric.value % 60).toString().padStart(2, '0')}`;
    }
    return metric.value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Analytics</h2>
          <p className="text-muted-foreground">
            Live data updates • Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={resetData}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-sm text-muted-foreground">
          {isActive ? 'Live tracking active' : 'Tracking paused'}
        </span>
      </div>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <div className={metric.color}>{metric.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatValue(metric)}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(metric.trend)}
                <span>{metric.change}</span>
                <span>from last update</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Live Activity</CardTitle>
          <CardDescription>Real-time user activity and events</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="activeUsers"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="pageViews"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live Events Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Events</CardTitle>
          <CardDescription>Real-time user actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No events yet. Start tracking to see live events.
              </p>
            ) : (
              events.map((event, index) => (
                <div key={event.id}>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-sm">{event.description}</span>
                      {event.userId && (
                        <span className="text-xs text-muted-foreground">
                          {event.userId}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {index < events.length - 1 && <Separator />}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}