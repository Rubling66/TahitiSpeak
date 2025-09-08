'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import {
  BookOpen,
  Trophy,
  Clock,
  TrendingUp,
  Calendar,
  Star,
  Target,
  Users,
  BarChart3,
  Activity,
  Award,
  Zap,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Settings,
  Bell,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  totalLessons: number;
  completedLessons: number;
  currentStreak: number;
  totalPoints: number;
  weeklyGoal: number;
  weeklyProgress: number;
  averageScore: number;
  timeSpent: number;
}

interface RecentActivity {
  id: string;
  type: 'lesson' | 'quiz' | 'achievement' | 'milestone';
  title: string;
  description: string;
  timestamp: string;
  score?: number;
  points?: number;
}

interface LearningGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  deadline: string;
  type: 'lessons' | 'points' | 'streak' | 'time';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export function UserDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { hasRole } = useAuthorization();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLessons: 0,
    completedLessons: 0,
    currentStreak: 0,
    totalPoints: 0,
    weeklyGoal: 0,
    weeklyProgress: 0,
    averageScore: 0,
    timeSpent: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - In real app, this would come from API
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock stats
      setStats({
        totalLessons: 45,
        completedLessons: 28,
        currentStreak: 7,
        totalPoints: 2840,
        weeklyGoal: 5,
        weeklyProgress: 3,
        averageScore: 87,
        timeSpent: 1260 // minutes
      });
      
      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'lesson',
          title: 'Basic Greetings',
          description: 'Completed lesson with 95% accuracy',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          score: 95,
          points: 120
        },
        {
          id: '2',
          type: 'achievement',
          title: 'Week Warrior',
          description: 'Completed 7 days in a row',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          points: 200
        },
        {
          id: '3',
          type: 'quiz',
          title: 'Vocabulary Quiz',
          description: 'Scored 88% on intermediate vocabulary',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          score: 88,
          points: 80
        },
        {
          id: '4',
          type: 'milestone',
          title: '1000 Points',
          description: 'Reached 1000 total points milestone',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          points: 100
        }
      ]);
      
      // Mock learning goals
      setLearningGoals([
        {
          id: '1',
          title: 'Weekly Lessons',
          description: 'Complete 5 lessons this week',
          target: 5,
          current: 3,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'lessons'
        },
        {
          id: '2',
          title: 'Monthly Points',
          description: 'Earn 1000 points this month',
          target: 1000,
          current: 640,
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'points'
        },
        {
          id: '3',
          title: 'Study Streak',
          description: 'Maintain a 14-day study streak',
          target: 14,
          current: 7,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'streak'
        }
      ]);
      
      // Mock achievements
      setAchievements([
        {
          id: '1',
          title: 'First Steps',
          description: 'Complete your first lesson',
          icon: '🎯',
          unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Week Warrior',
          description: 'Study for 7 consecutive days',
          icon: '🔥',
          unlockedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          title: 'Perfect Score',
          description: 'Get 100% on any lesson',
          icon: '⭐',
          progress: 95,
          target: 100
        },
        {
          id: '4',
          title: 'Speed Learner',
          description: 'Complete 10 lessons in one day',
          icon: '⚡',
          progress: 3,
          target: 10
        }
      ]);
      
      setIsLoading(false);
    };
    
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen className="h-4 w-4" />;
      case 'quiz': return <Target className="h-4 w-4" />;
      case 'achievement': return <Award className="h-4 w-4" />;
      case 'milestone': return <Trophy className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'text-blue-600';
      case 'quiz': return 'text-green-600';
      case 'achievement': return 'text-purple-600';
      case 'milestone': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'lessons': return <BookOpen className="h-4 w-4" />;
      case 'points': return <Star className="h-4 w-4" />;
      case 'streak': return <Zap className="h-4 w-4" />;
      case 'time': return <Clock className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to view your dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to continue your Tahitian learning journey?
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lessons</p>
                <p className="text-2xl font-bold">
                  {stats.completedLessons}/{stats.totalLessons}
                </p>
              </div>
            </div>
            <Progress 
              value={(stats.completedLessons / stats.totalLessons) * 100} 
              className="mt-3" 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{stats.currentStreak} days</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep it up! 🔥
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg: {stats.averageScore}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time Spent</p>
                <p className="text-2xl font-bold">{formatTime(stats.timeSpent)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Weekly Goal</span>
                </CardTitle>
                <CardDescription>
                  Complete {stats.weeklyGoal} lessons this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{stats.weeklyProgress} of {stats.weeklyGoal} lessons</span>
                    <span>{Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%</span>
                  </div>
                  <Progress value={(stats.weeklyProgress / stats.weeklyGoal) * 100} />
                  <p className="text-xs text-muted-foreground">
                    {stats.weeklyGoal - stats.weeklyProgress} lessons remaining
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Continue your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Continue Last Lesson
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Review Vocabulary
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Take Practice Quiz
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full bg-muted ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      {activity.points && (
                        <Badge variant="secondary" className="mt-1">
                          +{activity.points} points
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {learningGoals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    {getGoalIcon(goal.type)}
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {goal.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{goal.current} of {goal.target}</span>
                      <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                    </div>
                    <Progress value={(goal.current / goal.target) * 100} />
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.unlockedAt ? 'border-green-200' : 'opacity-75'}>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <div className="text-4xl">{achievement.icon}</div>
                    <h3 className="font-semibold">{achievement.title}</h3>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    
                    {achievement.unlockedAt ? (
                      <div className="flex items-center justify-center space-x-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">Unlocked</span>
                      </div>
                    ) : achievement.progress !== undefined ? (
                      <div className="space-y-1">
                        <Progress value={(achievement.progress! / achievement.target!) * 100} />
                        <p className="text-xs text-muted-foreground">
                          {achievement.progress} / {achievement.target}
                        </p>
                      </div>
                    ) : (
                      <Badge variant="outline">Locked</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Activity</CardTitle>
              <CardDescription>
                Your complete learning history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <div className={`p-2 rounded-full bg-muted ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                      <div className="flex items-center space-x-2">
                        {activity.score && (
                          <Badge variant="outline">
                            Score: {activity.score}%
                          </Badge>
                        )}
                        {activity.points && (
                          <Badge variant="secondary">
                            +{activity.points} points
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UserDashboard;