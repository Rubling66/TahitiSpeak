'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, Wand2, FileText, MessageSquare, Languages, 
  Lightbulb, Target, Clock, CheckCircle, AlertCircle,
  Download, Copy, RefreshCw, Sparkles, BookOpen,
  PenTool, Mic, Video, Image as ImageIcon, Bot,
  Zap, TrendingUp, Users, BarChart3, Settings,
  Play, Pause, Save, Upload, Eye, Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { AIService } from '@/lib/genkit/AIService';

interface AIContentDashboardProps {
  className?: string;
}

interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  type: 'conversation' | 'vocabulary' | 'grammar' | 'culture' | 'pronunciation';
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  components: string[];
  popularity: number;
}

interface ContentSuggestion {
  id: string;
  type: 'lesson' | 'quiz' | 'exercise' | 'assessment';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  learningObjectives: string[];
  content: any;
  confidence: number;
  aiGenerated: boolean;
  status: 'draft' | 'review' | 'published';
}

interface AIInsight {
  id: string;
  type: 'performance' | 'engagement' | 'difficulty' | 'content-gap';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestion: string;
  data?: any;
}

interface GenerationRequest {
  topic: string;
  type: 'lesson' | 'quiz' | 'exercise' | 'assessment';
  level: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
  duration: number;
  includeAudio: boolean;
  includeImages: boolean;
  customInstructions?: string;
}

const AIContentDashboard = React.memo(function AIContentDashboard({ className }: AIContentDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generator');
  const [aiService] = useState(() => AIService.getInstance());
  
  // Content Generation State
  const [generationRequest, setGenerationRequest] = useState<GenerationRequest>({
    topic: '',
    type: 'lesson',
    level: 'beginner',
    focusAreas: [],
    duration: 30,
    includeAudio: false,
    includeImages: false
  });
  const [generatedContent, setGeneratedContent] = useState<ContentSuggestion[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);
  
  // AI Insights State
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // Batch Operations State
  const [batchOperations, setBatchOperations] = useState({
    selectedContent: [] as string[],
    operation: 'translate' as 'translate' | 'optimize' | 'duplicate' | 'publish',
    targetLanguage: 'fr' as 'fr' | 'ty' | 'en',
    progress: 0
  });

  // Mock data for lesson templates
  const lessonTemplates: LessonTemplate[] = [
    {
      id: '1',
      name: 'Basic Greetings',
      description: 'Essential greetings and polite expressions in Tahitian',
      type: 'conversation',
      level: 'beginner',
      estimatedTime: 20,
      components: ['vocabulary', 'audio', 'practice'],
      popularity: 95
    },
    {
      id: '2',
      name: 'Family & Relationships',
      description: 'Learn to talk about family members and relationships',
      type: 'vocabulary',
      level: 'beginner',
      estimatedTime: 30,
      components: ['vocabulary', 'images', 'quiz'],
      popularity: 88
    },
    {
      id: '3',
      name: 'Tahitian Culture & Traditions',
      description: 'Explore Tahitian culture through language',
      type: 'culture',
      level: 'intermediate',
      estimatedTime: 45,
      components: ['reading', 'video', 'discussion'],
      popularity: 92
    },
    {
      id: '4',
      name: 'Pronunciation Mastery',
      description: 'Master Tahitian pronunciation with guided practice',
      type: 'pronunciation',
      level: 'intermediate',
      estimatedTime: 25,
      components: ['audio', 'recording', 'feedback'],
      popularity: 85
    }
  ];

  useEffect(() => {
    loadAIInsights();
  }, []);

  const loadAIInsights = async () => {
    setInsightsLoading(true);
    try {
      // Simulate AI insights generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const insights: AIInsight[] = [
        {
          id: '1',
          type: 'content-gap',
          title: 'Missing Advanced Grammar Content',
          description: 'Students are struggling with advanced grammar concepts. Consider adding more intermediate-to-advanced grammar lessons.',
          impact: 'high',
          actionable: true,
          suggestion: 'Create 3-4 lessons focusing on complex sentence structures and verb conjugations.',
          data: { affectedStudents: 156, completionRate: 45 }
        },
        {
          id: '2',
          type: 'engagement',
          title: 'Low Engagement in Audio Lessons',
          description: 'Audio-based lessons show 30% lower completion rates compared to visual content.',
          impact: 'medium',
          actionable: true,
          suggestion: 'Add visual aids and interactive elements to audio lessons.',
          data: { avgCompletionRate: 62, targetRate: 85 }
        },
        {
          id: '3',
          type: 'performance',
          title: 'Excellent Vocabulary Retention',
          description: 'Students show 95% retention rate for vocabulary lessons with spaced repetition.',
          impact: 'high',
          actionable: true,
          suggestion: 'Apply spaced repetition methodology to other lesson types.',
          data: { retentionRate: 95, improvementPotential: 25 }
        }
      ];
      
      setAiInsights(insights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      toast.error('Failed to load AI insights');
    } finally {
      setInsightsLoading(false);
    }
  };

  const generateContent = async () => {
    if (!generationRequest.topic.trim()) {
      toast.error('Please enter a topic for content generation');
      return;
    }
    
    setLoading(true);
    try {
      // Use the actual AI service to generate lesson content
      const lessonContent = await aiService.generateLesson(
        generationRequest.topic,
        generationRequest.level,
        generationRequest.focusAreas
      );
      
      const suggestion: ContentSuggestion = {
        id: Date.now().toString(),
        type: generationRequest.type,
        title: lessonContent.title,
        description: lessonContent.description,
        difficulty: generationRequest.level,
        estimatedTime: generationRequest.duration,
        learningObjectives: [`Learn ${generationRequest.topic}`, 'Practice vocabulary', 'Complete exercises'],
        content: lessonContent,
        confidence: 0.92,
        aiGenerated: true,
        status: 'draft'
      };
      
      setGeneratedContent(prev => [suggestion, ...prev]);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateFromTemplate = async (template: LessonTemplate) => {
    setLoading(true);
    try {
      const lessonContent = await aiService.generateLesson(
        template.name,
        template.level,
        [template.type]
      );
      
      const suggestion: ContentSuggestion = {
        id: Date.now().toString(),
        type: 'lesson',
        title: `${template.name} (Template)`,
        description: template.description,
        difficulty: template.level,
        estimatedTime: template.estimatedTime,
        learningObjectives: [`Master ${template.name}`, 'Practice with examples', 'Apply knowledge'],
        content: lessonContent,
        confidence: 0.95,
        aiGenerated: true,
        status: 'draft'
      };
      
      setGeneratedContent(prev => [suggestion, ...prev]);
      toast.success(`Lesson generated from ${template.name} template!`);
    } catch (error) {
      console.error('Error generating from template:', error);
      toast.error('Failed to generate content from template');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchOperation = async () => {
    if (batchOperations.selectedContent.length === 0) {
      toast.error('Please select content for batch operation');
      return;
    }
    
    setLoading(true);
    try {
      // Simulate batch operation progress
      for (let i = 0; i <= 100; i += 10) {
        setBatchOperations(prev => ({ ...prev, progress: i }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      toast.success(`Batch ${batchOperations.operation} completed successfully!`);
      setBatchOperations(prev => ({ ...prev, selectedContent: [], progress: 0 }));
    } catch (error) {
      console.error('Error in batch operation:', error);
      toast.error('Batch operation failed');
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-50';
      case 'review': return 'text-yellow-600 bg-yellow-50';
      case 'draft': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Content Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Generate, optimize, and manage AI-powered content for Tahitian language learning
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAIInsights}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Insights
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      {aiInsights.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>AI Insight:</strong> {aiInsights[0].description}
            <Button variant="link" className="p-0 h-auto ml-2 text-blue-600">
              View Details →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Batch Ops
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content Library
          </TabsTrigger>
        </TabsList>

        {/* Content Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Content Generator
                </CardTitle>
                <CardDescription>
                  Generate personalized Tahitian language content using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Tahitian greetings, family vocabulary..."
                    value={generationRequest.topic}
                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Content Type</Label>
                    <Select
                      value={generationRequest.type}
                      onValueChange={(value: any) => setGenerationRequest(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lesson">Lesson</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="exercise">Exercise</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Difficulty Level</Label>
                    <Select
                      value={generationRequest.level}
                      onValueChange={(value: any) => setGenerationRequest(prev => ({ ...prev, level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="120"
                    value={generationRequest.duration}
                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Focus Areas</Label>
                  <div className="flex flex-wrap gap-2">
                    {['vocabulary', 'grammar', 'pronunciation', 'culture', 'conversation'].map((area) => (
                      <Button
                        key={area}
                        variant={generationRequest.focusAreas.includes(area) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setGenerationRequest(prev => ({
                            ...prev,
                            focusAreas: prev.focusAreas.includes(area)
                              ? prev.focusAreas.filter(a => a !== area)
                              : [...prev.focusAreas, area]
                          }));
                        }}
                      >
                        {area}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Options</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={generationRequest.includeAudio}
                        onChange={(e) => setGenerationRequest(prev => ({ ...prev, includeAudio: e.target.checked }))}
                      />
                      <span className="text-sm">Include Audio</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={generationRequest.includeImages}
                        onChange={(e) => setGenerationRequest(prev => ({ ...prev, includeImages: e.target.checked }))}
                      />
                      <span className="text-sm">Include Images</span>
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={generateContent}
                  disabled={loading || !generationRequest.topic.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Content Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Generated Content
                </CardTitle>
                <CardDescription>
                  Preview and manage your AI-generated content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedContent.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No content generated yet</p>
                    <p className="text-sm">Use the generator to create your first lesson</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {generatedContent.map((content) => (
                      <div key={content.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{content.title}</h4>
                            <p className="text-sm text-gray-600">{content.description}</p>
                          </div>
                          <div className="flex gap-1">
                            <Badge className={getStatusColor(content.status)}>
                              {content.status}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(content.confidence * 100)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{content.difficulty} • {content.estimatedTime}min</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline">
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Lesson Templates
              </CardTitle>
              <CardDescription>
                Quick-start templates for common lesson types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessonTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.level}</Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{template.estimatedTime} min</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {template.popularity}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.components.map((component) => (
                            <Badge key={component} variant="secondary" className="text-xs">
                              {component}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => generateFromTemplate(template)}
                          disabled={loading}
                        >
                          <Wand2 className="h-3 w-3 mr-1" />
                          Generate from Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Data-driven recommendations to improve your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Analyzing content performance...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiInsights.map((insight) => (
                    <Card key={insight.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{insight.description}</p>
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <p className="text-sm font-medium text-blue-800">AI Suggestion:</p>
                          <p className="text-sm text-blue-700">{insight.suggestion}</p>
                        </div>
                        {insight.data && (
                          <div className="flex gap-4 text-sm text-gray-600">
                            {Object.entries(insight.data).map(([key, value]) => (
                              <span key={key}>
                                <strong>{key}:</strong> {value}
                              </span>
                            ))}
                          </div>
                        )}
                        {insight.actionable && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Apply Suggestion
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Operations Tab */}
        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Batch Operations
              </CardTitle>
              <CardDescription>
                Perform bulk operations on multiple content items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Operation Type</Label>
                  <Select
                    value={batchOperations.operation}
                    onValueChange={(value: any) => setBatchOperations(prev => ({ ...prev, operation: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="translate">Translate</SelectItem>
                      <SelectItem value="optimize">Optimize</SelectItem>
                      <SelectItem value="duplicate">Duplicate</SelectItem>
                      <SelectItem value="publish">Publish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {batchOperations.operation === 'translate' && (
                  <div className="space-y-2">
                    <Label>Target Language</Label>
                    <Select
                      value={batchOperations.targetLanguage}
                      onValueChange={(value: any) => setBatchOperations(prev => ({ ...prev, targetLanguage: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="ty">Tahitian</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Selected Items</Label>
                  <div className="text-sm text-gray-600">
                    {batchOperations.selectedContent.length} items selected
                  </div>
                </div>
              </div>

              {batchOperations.progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{batchOperations.progress}%</span>
                  </div>
                  <Progress value={batchOperations.progress} />
                </div>
              )}

              <Button 
                onClick={handleBatchOperation}
                disabled={loading || batchOperations.selectedContent.length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Execute Batch Operation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AI Content Library
              </CardTitle>
              <CardDescription>
                Manage all your AI-generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedContent.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No content yet</h3>
                  <p>Start generating content to see it here</p>
                  <Button className="mt-4" onClick={() => setActiveTab('generator')}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedContent.map((content) => (
                    <Card key={content.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{content.title}</h4>
                            <p className="text-sm text-gray-600">{content.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(content.status)}>
                              {content.status}
                            </Badge>
                            <Badge variant="outline">
                              AI Generated
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            {content.difficulty} • {content.estimatedTime}min • {Math.round(content.confidence * 100)}% confidence
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Export
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default AIContentDashboard;