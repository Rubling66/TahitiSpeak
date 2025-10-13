// ProgressTracker Component - Track story progress with cultural authenticity scoring
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  Star, 
  BookOpen, 
  Users, 
  Globe, 
  Calendar,
  TrendingUp,
  Award,
  Target,
  Clock,
  CheckCircle,
  BarChart3,
  Compass,
  Heart,
  Lightbulb
} from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase/client';
import { useStoryProgress } from '@/hooks/useStoryProgress';
import { useCulturalAnnotations } from '@/hooks/useCulturalAnnotations';
import type { 
  UserStoryProgress, 
  CulturalKnowledgePoint, 
  Story,
  ProgressTrackerProps 
} from '@/types/story-system';

interface ProgressStats {
  totalStoriesRead: number;
  totalTimeSpent: number;
  averageCompletionRate: number;
  culturalKnowledgePoints: number;
  authenticityScore: number;
  storiesCompleted: number;
  annotationsViewed: number;
  discussionsParticipated: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  category: 'reading' | 'cultural' | 'community' | 'authenticity';
}

export function ProgressTracker({ userId }: ProgressTrackerProps) {
  const [stats, setStats] = useState<ProgressStats>({
    totalStoriesRead: 0,
    totalTimeSpent: 0,
    averageCompletionRate: 0,
    culturalKnowledgePoints: 0,
    authenticityScore: 0,
    storiesCompleted: 0,
    annotationsViewed: 0,
    discussionsParticipated: 0
  });
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentProgress, setRecentProgress] = useState<UserStoryProgress[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<CulturalKnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('overview');

  const { progress: userProgress } = useStoryProgress(userId);
  const { knowledgePoints: culturalPoints } = useCulturalAnnotations();

  // Load user statistics
  const loadStats = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Get story progress stats
      const { data: progressData } = await supabase
        .from('user_story_progress')
        .select(`
          *,
          story:stories(title, category, difficulty_level, cultural_authenticity_score)
        `)
        .eq('user_id', user.id);

      // Get cultural knowledge points
      const { data: knowledgeData } = await supabase
        .from('cultural_knowledge_points')
        .select('*')
        .eq('user_id', user.id);

      // Get discussion participation
      const { data: discussionData } = await supabase
        .from('story_discussions')
        .select('id')
        .eq('user_id', user.id);

      if (progressData) {
        const completedStories = progressData.filter(p => p.is_completed);
        const totalTimeSpent = progressData.reduce((sum, p) => sum + (p.time_spent || 0), 0);
        const totalCompletionRate = progressData.length > 0 
          ? progressData.reduce((sum, p) => sum + p.completion_percentage, 0) / progressData.length 
          : 0;
        
        const authenticityScore = completedStories.length > 0
          ? completedStories.reduce((sum, p) => sum + (p.story?.cultural_authenticity_score || 0), 0) / completedStories.length
          : 0;

        setStats({
          totalStoriesRead: progressData.length,
          totalTimeSpent,
          averageCompletionRate: totalCompletionRate,
          culturalKnowledgePoints: knowledgeData?.reduce((sum, k) => sum + k.points_earned, 0) || 0,
          authenticityScore,
          storiesCompleted: completedStories.length,
          annotationsViewed: knowledgeData?.length || 0,
          discussionsParticipated: discussionData?.length || 0
        });

        setRecentProgress(progressData.slice(0, 5));
      }

      if (knowledgeData) {
        setKnowledgePoints(knowledgeData);
      }

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate achievements based on stats
  const generateAchievements = () => {
    const achievementList: Achievement[] = [
      // Reading Achievements
      {
        id: 'first_story',
        title: 'First Steps',
        description: 'Complete your first Polynesian story',
        icon: <BookOpen className="h-5 w-5" />,
        unlocked: stats.storiesCompleted >= 1,
        progress: Math.min(stats.storiesCompleted, 1),
        maxProgress: 1,
        category: 'reading'
      },
      {
        id: 'story_explorer',
        title: 'Story Explorer',
        description: 'Complete 5 different stories',
        icon: <Compass className="h-5 w-5" />,
        unlocked: stats.storiesCompleted >= 5,
        progress: Math.min(stats.storiesCompleted, 5),
        maxProgress: 5,
        category: 'reading'
      },
      {
        id: 'dedicated_reader',
        title: 'Dedicated Reader',
        description: 'Spend 2 hours reading stories',
        icon: <Clock className="h-5 w-5" />,
        unlocked: stats.totalTimeSpent >= 120,
        progress: Math.min(stats.totalTimeSpent, 120),
        maxProgress: 120,
        category: 'reading'
      },
      
      // Cultural Achievements
      {
        id: 'cultural_learner',
        title: 'Cultural Learner',
        description: 'View 10 cultural annotations',
        icon: <Globe className="h-5 w-5" />,
        unlocked: stats.annotationsViewed >= 10,
        progress: Math.min(stats.annotationsViewed, 10),
        maxProgress: 10,
        category: 'cultural'
      },
      {
        id: 'knowledge_seeker',
        title: 'Knowledge Seeker',
        description: 'Earn 100 cultural knowledge points',
        icon: <Lightbulb className="h-5 w-5" />,
        unlocked: stats.culturalKnowledgePoints >= 100,
        progress: Math.min(stats.culturalKnowledgePoints, 100),
        maxProgress: 100,
        category: 'cultural'
      },
      {
        id: 'authenticity_guardian',
        title: 'Authenticity Guardian',
        description: 'Maintain 90+ average authenticity score',
        icon: <Star className="h-5 w-5" />,
        unlocked: stats.authenticityScore >= 90,
        progress: Math.min(stats.authenticityScore, 90),
        maxProgress: 90,
        category: 'authenticity'
      },
      
      // Community Achievements
      {
        id: 'community_member',
        title: 'Community Member',
        description: 'Participate in 3 story discussions',
        icon: <Users className="h-5 w-5" />,
        unlocked: stats.discussionsParticipated >= 3,
        progress: Math.min(stats.discussionsParticipated, 3),
        maxProgress: 3,
        category: 'community'
      },
      {
        id: 'cultural_ambassador',
        title: 'Cultural Ambassador',
        description: 'Participate in 10 discussions',
        icon: <Heart className="h-5 w-5" />,
        unlocked: stats.discussionsParticipated >= 10,
        progress: Math.min(stats.discussionsParticipated, 10),
        maxProgress: 10,
        category: 'community'
      }
    ];

    setAchievements(achievementList);
  };

  useEffect(() => {
    loadStats();
  }, [userId]);

  useEffect(() => {
    generateAchievements();
  }, [stats]);

  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'cultural': return 'bg-green-100 text-green-800';
      case 'community': return 'bg-purple-100 text-purple-800';
      case 'authenticity': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Cultural Learning Progress
          </CardTitle>
          <p className="text-gray-600">
            Track your journey through Polynesian stories and cultural knowledge
          </p>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="progress">Recent Progress</TabsTrigger>
          <TabsTrigger value="knowledge">Cultural Knowledge</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stories Read</p>
                    <p className="text-2xl font-bold">{stats.totalStoriesRead}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold">{stats.storiesCompleted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time Spent</p>
                    <p className="text-2xl font-bold">{formatTime(stats.totalTimeSpent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Authenticity Score</p>
                    <p className="text-2xl font-bold">{stats.authenticityScore.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reading Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Average Completion</span>
                    <span>{stats.averageCompletionRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={stats.averageCompletionRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Cultural Knowledge</span>
                    <span>{stats.culturalKnowledgePoints} points</span>
                  </div>
                  <Progress value={Math.min((stats.culturalKnowledgePoints / 500) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cultural Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Annotations Viewed</span>
                    <span>{stats.annotationsViewed}</span>
                  </div>
                  <Progress value={Math.min((stats.annotationsViewed / 50) * 100, 100)} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Discussions Joined</span>
                    <span>{stats.discussionsParticipated}</span>
                  </div>
                  <Progress value={Math.min((stats.discussionsParticipated / 20) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.unlocked ? 'border-green-200 bg-green-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {achievement.unlocked ? (
                        <Trophy className="h-5 w-5 text-green-600" />
                      ) : (
                        achievement.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <Badge variant="outline" className={getCategoryColor(achievement.category)}>
                          {achievement.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recent Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Story Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {recentProgress.map((progress, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{progress.story?.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>Progress: {progress.completion_percentage}%</span>
                          <span>Time: {formatTime(progress.time_spent || 0)}</span>
                          {progress.is_completed && (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {new Date(progress.last_read_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {recentProgress.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No reading progress yet</p>
                      <p className="text-sm">Start reading stories to track your progress</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cultural Knowledge Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cultural Knowledge Points</CardTitle>
              <p className="text-sm text-gray-600">
                Points earned from viewing cultural annotations and learning about Polynesian culture
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {knowledgePoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Lightbulb className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{point.annotation_title}</h4>
                        <p className="text-sm text-gray-600">{point.knowledge_area}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">+{point.points_earned}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(point.earned_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {knowledgePoints.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No cultural knowledge points yet</p>
                      <p className="text-sm">View cultural annotations to start earning points</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}