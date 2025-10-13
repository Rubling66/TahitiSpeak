import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  HeatMapGrid,
  HeatMapValue
} from 'react-grid-heatmap';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  MousePointer, 
  Eye, 
  Clock, 
  Navigation, 
  Zap,
  Target,
  TrendingUp,
  Users,
  Activity,
  Download
} from 'lucide-react';
import { useEngagementTracking } from '../../hooks/useAnalytics';

interface UserSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  pageViews: number;
  clicks: number;
  scrollDepth: number;
  bounceRate: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location: string;
}

interface HeatmapData {
  x: number;
  y: number;
  value: number;
}

interface UserFlow {
  from: string;
  to: string;
  count: number;
  percentage: number;
}

interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  impact: 'high' | 'medium' | 'low';
  trend: 'increasing' | 'decreasing' | 'stable';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function UserBehaviorTracker() {
  const { trackFeatureUsage, trackTimeSpent, trackScrollDepth } = useEngagementTracking();
  
  const [isTracking, setIsTracking] = useState(false);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [userFlows, setUserFlows] = useState<UserFlow[]>([]);
  const [behaviorPatterns, setBehaviorPatterns] = useState<BehaviorPattern[]>([]);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  
  const mouseTrackingRef = useRef<{ x: number; y: number; timestamp: number }[]>([]);
  const scrollTrackingRef = useRef<{ depth: number; timestamp: number }[]>([]);
  const clickTrackingRef = useRef<{ x: number; y: number; element: string; timestamp: number }[]>([]);
  const pageStartTimeRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);

  useEffect(() => {
    if (isTracking) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [isTracking]);

  useEffect(() => {
    // Initialize with sample data
    initializeSampleData();
  }, []);

  const startTracking = () => {
    // Start new session
    const session: UserSession = {
      id: Date.now().toString(),
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      startTime: new Date(),
      duration: 0,
      pageViews: 1,
      clicks: 0,
      scrollDepth: 0,
      bounceRate: false,
      deviceType: getDeviceType(),
      location: 'Unknown'
    };

    setCurrentSession(session);
    pageStartTimeRef.current = Date.now();
    maxScrollDepthRef.current = 0;

    // Setup event listeners
    setupEventListeners();

    console.log('User behavior tracking started');
  };

  const stopTracking = () => {
    if (currentSession) {
      // End current session
      const endTime = new Date();
      const duration = endTime.getTime() - currentSession.startTime.getTime();
      
      const completedSession: UserSession = {
        ...currentSession,
        endTime,
        duration: Math.floor(duration / 1000),
        scrollDepth: maxScrollDepthRef.current,
        clicks: clickTrackingRef.current.length
      };

      setSessions(prev => [completedSession, ...prev.slice(0, 49)]);
      setCurrentSession(null);
    }

    // Remove event listeners
    removeEventListeners();

    console.log('User behavior tracking stopped');
  };

  const setupEventListeners = () => {
    // Mouse movement tracking
    const handleMouseMove = (event: MouseEvent) => {
      mouseTrackingRef.current.push({
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now()
      });

      // Keep only last 1000 mouse movements
      if (mouseTrackingRef.current.length > 1000) {
        mouseTrackingRef.current = mouseTrackingRef.current.slice(-1000);
      }

      // Update heatmap data periodically
      if (mouseTrackingRef.current.length % 50 === 0) {
        updateHeatmapData();
      }
    };

    // Click tracking
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementInfo = `${target.tagName}${target.className ? '.' + target.className.split(' ')[0] : ''}`;
      
      clickTrackingRef.current.push({
        x: event.clientX,
        y: event.clientY,
        element: elementInfo,
        timestamp: Date.now()
      });

      trackFeatureUsage(elementInfo, 'click', {
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now()
      });
    };

    // Scroll tracking
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = Math.round((scrollTop / documentHeight) * 100);
      
      maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, scrollPercentage);
      
      scrollTrackingRef.current.push({
        depth: scrollPercentage,
        timestamp: Date.now()
      });

      // Track scroll depth milestone
      if (scrollPercentage > 0 && scrollPercentage % 25 === 0) {
        trackScrollDepth(window.location.pathname, scrollPercentage);
      }
    };

    // Page visibility tracking
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden
        const timeSpent = Date.now() - pageStartTimeRef.current;
        trackTimeSpent(window.location.pathname, Math.floor(timeSpent / 1000));
      } else {
        // Page became visible
        pageStartTimeRef.current = Date.now();
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Store cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  };

  const removeEventListeners = () => {
    // Event listeners are cleaned up in setupEventListeners return function
  };

  const updateHeatmapData = () => {
    const gridSize = 20;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    const heatmap: { [key: string]: number } = {};

    mouseTrackingRef.current.forEach(point => {
      const gridX = Math.floor(point.x / cellWidth);
      const gridY = Math.floor(point.y / cellHeight);
      const key = `${gridX}-${gridY}`;
      heatmap[key] = (heatmap[key] || 0) + 1;
    });

    const heatmapArray: HeatmapData[] = [];
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = `${x}-${y}`;
        heatmapArray.push({
          x,
          y,
          value: heatmap[key] || 0
        });
      }
    }

    setHeatmapData(heatmapArray);
  };

  const initializeSampleData = () => {
    // Sample user flows
    const sampleFlows: UserFlow[] = [
      { from: 'Home', to: 'Lessons', count: 150, percentage: 35 },
      { from: 'Lessons', to: 'Exercise', count: 120, percentage: 28 },
      { from: 'Exercise', to: 'Progress', count: 80, percentage: 19 },
      { from: 'Progress', to: 'Settings', count: 45, percentage: 11 },
      { from: 'Settings', to: 'Home', count: 30, percentage: 7 }
    ];

    // Sample behavior patterns
    const samplePatterns: BehaviorPattern[] = [
      {
        id: '1',
        name: 'Quick Learners',
        description: 'Users who complete lessons rapidly with high accuracy',
        frequency: 25,
        impact: 'high',
        trend: 'increasing'
      },
      {
        id: '2',
        name: 'Struggling Students',
        description: 'Users who take multiple attempts and use many hints',
        frequency: 15,
        impact: 'high',
        trend: 'decreasing'
      },
      {
        id: '3',
        name: 'Casual Browsers',
        description: 'Users who browse content but rarely complete exercises',
        frequency: 35,
        impact: 'medium',
        trend: 'stable'
      },
      {
        id: '4',
        name: 'Power Users',
        description: 'Users who engage with all features and spend significant time',
        frequency: 20,
        impact: 'high',
        trend: 'increasing'
      },
      {
        id: '5',
        name: 'Mobile-First Users',
        description: 'Users who primarily access the app via mobile devices',
        frequency: 45,
        impact: 'medium',
        trend: 'increasing'
      }
    ];

    setUserFlows(sampleFlows);
    setBehaviorPatterns(samplePatterns);
  };

  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const exportBehaviorData = () => {
    const data = {
      sessions,
      heatmapData,
      userFlows,
      behaviorPatterns,
      mouseTracking: mouseTrackingRef.current,
      clickTracking: clickTrackingRef.current,
      scrollTracking: scrollTrackingRef.current
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-behavior-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPatternIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Target className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      default:
        return <Users className="h-4 w-4 text-green-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Behavior Tracking</h2>
          <p className="text-muted-foreground">
            Analyze user interactions and behavior patterns
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isTracking ? "destructive" : "default"}
            onClick={() => setIsTracking(!isTracking)}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Button>
          <Button variant="outline" onClick={exportBehaviorData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Tracking Status */}
      {isTracking && currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Session Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-semibold">
                  {Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000)}s
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mouse Movements</p>
                <p className="text-lg font-semibold">{mouseTrackingRef.current.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clicks</p>
                <p className="text-lg font-semibold">{clickTrackingRef.current.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Scroll</p>
                <p className="text-lg font-semibold">{maxScrollDepthRef.current}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Behavior Patterns</TabsTrigger>
          <TabsTrigger value="flows">User Flows</TabsTrigger>
          <TabsTrigger value="heatmap">Interaction Heatmap</TabsTrigger>
          <TabsTrigger value="sessions">Session Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Identified Patterns</CardTitle>
                <CardDescription>User behavior patterns and their impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {behaviorPatterns.map((pattern) => (
                    <div key={pattern.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getPatternIcon(pattern.impact)}
                        <div>
                          <p className="font-medium">{pattern.name}</p>
                          <p className="text-sm text-muted-foreground">{pattern.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{pattern.frequency}%</Badge>
                        {getTrendIcon(pattern.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pattern Distribution</CardTitle>
                <CardDescription>Frequency of behavior patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={behaviorPatterns}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="frequency"
                      label={({ name, frequency }) => `${name}: ${frequency}%`}
                    >
                      {behaviorPatterns.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Flow Analysis</CardTitle>
              <CardDescription>How users navigate through the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userFlows.map((flow, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Navigation className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{flow.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{flow.to}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">{flow.count} users</p>
                        <p className="text-sm text-muted-foreground">{flow.percentage}%</p>
                      </div>
                      <Progress value={flow.percentage} className="w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interaction Heatmap</CardTitle>
              <CardDescription>
                Mouse movement and click patterns
                {isTracking && ' (Live tracking active)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {heatmapData.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-96">
                    <HeatMapGrid
                      data={heatmapData}
                      xLabels={Array.from({ length: 20 }, (_, i) => i.toString())}
                      yLabels={Array.from({ length: 20 }, (_, i) => i.toString())}
                      cellRender={(x, y, value) => (
                        <div
                          key={`${x}-${y}`}
                          style={{
                            backgroundColor: `rgba(66, 165, 245, ${Math.min(value / 10, 1)})`,
                            width: '100%',
                            height: '100%'
                          }}
                        />
                      )}
                      cellStyle={(x, y, ratio) => ({
                        background: `rgba(66, 165, 245, ${ratio})`,
                        fontSize: '11px',
                        color: ratio > 0.5 ? 'white' : 'black'
                      })}
                      cellHeight="2rem"
                      square
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isTracking 
                    ? 'Move your mouse around to generate heatmap data...'
                    : 'Start tracking to see interaction heatmap'
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Analysis</CardTitle>
              <CardDescription>Recent user sessions and their characteristics</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.slice(0, 10).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{session.deviceType}</Badge>
                        <div>
                          <p className="font-medium">User {session.userId}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.startTime.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Math.floor(session.duration / 60)}m {session.duration % 60}s</p>
                        <p className="text-sm text-muted-foreground">
                          {session.clicks} clicks • {session.scrollDepth}% scroll
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No session data available. Start tracking to collect session information.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}