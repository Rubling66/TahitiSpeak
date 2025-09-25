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
import { 
  Brain, Wand2, FileText, MessageSquare, Languages, 
  Lightbulb, Target, Clock, CheckCircle, AlertCircle,
  Download, Copy, RefreshCw, Sparkles, BookOpen,
  PenTool, Mic, Video, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface AIContentCreatorProps {
  className?: string;
}

interface ContentSuggestion {
  id: string;
  type: 'lesson' | 'quiz' | 'exercise' | 'assessment';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  learningObjectives: string[];
  content: string;
  confidence: number;
}

interface OptimizationSuggestion {
  id: string;
  type: 'structure' | 'engagement' | 'accessibility' | 'difficulty';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  suggestion: string;
}

interface TranslationRequest {
  sourceLanguage: string;
  targetLanguage: string;
  content: string;
  context?: string;
}

export function AIContentCreator({ className }: AIContentCreatorProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generator');
  
  // Content Generation State
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<'lesson' | 'quiz' | 'exercise' | 'assessment'>('lesson');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [duration, setDuration] = useState(30);
  const [generatedContent, setGeneratedContent] = useState<ContentSuggestion[]>([]);
  
  // Content Optimization State
  const [existingContent, setExistingContent] = useState('');
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  
  // Translation State
  const [translationRequest, setTranslationRequest] = useState<TranslationRequest>({
    sourceLanguage: 'en',
    targetLanguage: 'fr',
    content: ''
  });
  const [translatedContent, setTranslatedContent] = useState('');
  
  // Quiz Generation State
  const [quizContent, setQuizContent] = useState('');
  const [quizType, setQuizType] = useState<'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer'>('multiple-choice');
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);

  const generateContent = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic for content generation');
      return;
    }
    
    setLoading(true);
    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const suggestions: ContentSuggestion[] = [
        {
          id: '1',
          type: contentType,
          title: `${topic} - Introduction`,
          description: `Comprehensive introduction to ${topic} covering fundamental concepts and practical applications.`,
          difficulty,
          estimatedTime: duration,
          learningObjectives: learningObjectives.split('\n').filter(obj => obj.trim()),
          content: generateMockContent(topic, contentType, difficulty),
          confidence: 0.92
        },
        {
          id: '2',
          type: contentType,
          title: `${topic} - Advanced Concepts`,
          description: `Deep dive into advanced ${topic} concepts with real-world examples and case studies.`,
          difficulty: difficulty === 'beginner' ? 'intermediate' : 'advanced',
          estimatedTime: duration + 15,
          learningObjectives: learningObjectives.split('\n').filter(obj => obj.trim()),
          content: generateMockContent(topic, contentType, 'advanced'),
          confidence: 0.87
        },
        {
          id: '3',
          type: contentType,
          title: `${topic} - Practical Application`,
          description: `Hands-on exercises and practical applications of ${topic} concepts.`,
          difficulty,
          estimatedTime: duration + 10,
          learningObjectives: learningObjectives.split('\n').filter(obj => obj.trim()),
          content: generateMockContent(topic, 'exercise', difficulty),
          confidence: 0.89
        }
      ];
      
      setGeneratedContent(suggestions);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const optimizeContent = async () => {
    if (!existingContent.trim()) {
      toast.error('Please enter content to optimize');
      return;
    }
    
    setLoading(true);
    try {
      // Simulate AI content optimization
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const suggestions: OptimizationSuggestion[] = [
        {
          id: '1',
          type: 'structure',
          title: 'Improve Content Structure',
          description: 'Add clear headings and subheadings to improve readability',
          impact: 'high',
          effort: 'low',
          suggestion: 'Break down the content into smaller sections with descriptive headings. Use bullet points for key concepts.'
        },
        {
          id: '2',
          type: 'engagement',
          title: 'Increase Engagement',
          description: 'Add interactive elements and multimedia content',
          impact: 'high',
          effort: 'medium',
          suggestion: 'Include interactive quizzes, videos, or animations to make the content more engaging for learners.'
        },
        {
          id: '3',
          type: 'accessibility',
          title: 'Enhance Accessibility',
          description: 'Improve content accessibility for all learners',
          impact: 'medium',
          effort: 'low',
          suggestion: 'Add alt text for images, use high contrast colors, and ensure proper heading hierarchy.'
        },
        {
          id: '4',
          type: 'difficulty',
          title: 'Adjust Difficulty Level',
          description: 'Content may be too complex for target audience',
          impact: 'medium',
          effort: 'medium',
          suggestion: 'Simplify technical terms and add more examples to make concepts clearer for beginners.'
        }
      ];
      
      setOptimizationSuggestions(suggestions);
      toast.success('Content analysis complete!');
    } catch (error) {
      console.error('Error optimizing content:', error);
      toast.error('Failed to analyze content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const translateContent = async () => {
    if (!translationRequest.content.trim()) {
      toast.error('Please enter content to translate');
      return;
    }
    
    setLoading(true);
    try {
      // Simulate AI translation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock translation based on target language
      let translated = '';
      if (translationRequest.targetLanguage === 'fr') {
        translated = `[Traduction française] ${translationRequest.content}`;
      } else if (translationRequest.targetLanguage === 'es') {
        translated = `[Traducción española] ${translationRequest.content}`;
      } else if (translationRequest.targetLanguage === 'ty') {
        translated = `[Traduction tahitienne] ${translationRequest.content}`;
      } else {
        translated = `[Translation to ${translationRequest.targetLanguage}] ${translationRequest.content}`;
      }
      
      setTranslatedContent(translated);
      toast.success('Content translated successfully!');
    } catch (error) {
      console.error('Error translating content:', error);
      toast.error('Failed to translate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!quizContent.trim()) {
      toast.error('Please enter content for quiz generation');
      return;
    }
    
    setLoading(true);
    try {
      // Simulate AI quiz generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const quiz = {
        title: 'Auto-Generated Quiz',
        description: 'Quiz automatically generated from provided content',
        questions: Array.from({ length: questionCount }, (_, i) => ({
          id: i + 1,
          type: quizType,
          question: `Question ${i + 1} based on the provided content?`,
          options: quizType === 'multiple-choice' ? [
            'Option A - Correct answer',
            'Option B - Incorrect',
            'Option C - Incorrect',
            'Option D - Incorrect'
          ] : undefined,
          correctAnswer: quizType === 'multiple-choice' ? 0 : 
                        quizType === 'true-false' ? true : 
                        'Sample correct answer',
          explanation: 'This is the explanation for why this answer is correct.',
          difficulty: difficulty,
          points: 1
        }))
      };
      
      setGeneratedQuiz(quiz);
      toast.success('Quiz generated successfully!');
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockContent = (topic: string, type: string, difficulty: string): string => {
    const templates = {
      lesson: `# ${topic} - Lesson Content\n\n## Introduction\nWelcome to this comprehensive lesson on ${topic}. This ${difficulty}-level content will help you understand the fundamental concepts and practical applications.\n\n## Learning Objectives\nBy the end of this lesson, you will be able to:\n- Understand the basic principles of ${topic}\n- Apply ${topic} concepts in real-world scenarios\n- Identify key components and their relationships\n\n## Main Content\n### Section 1: Fundamentals\n[Detailed explanation of ${topic} fundamentals]\n\n### Section 2: Practical Applications\n[Examples and use cases]\n\n### Section 3: Best Practices\n[Guidelines and recommendations]\n\n## Summary\nIn this lesson, we covered the essential aspects of ${topic}...`,
      quiz: `# ${topic} Quiz\n\n## Instructions\nThis quiz tests your understanding of ${topic}. Choose the best answer for each question.\n\n### Question 1\nWhat is the primary purpose of ${topic}?\na) Option A\nb) Option B\nc) Option C\nd) Option D\n\n[Additional questions...]`,
      exercise: `# ${topic} - Practical Exercise\n\n## Objective\nApply your knowledge of ${topic} through hands-on practice.\n\n## Instructions\n1. Review the provided scenario\n2. Identify the key ${topic} concepts involved\n3. Develop a solution using best practices\n4. Test and validate your approach\n\n## Scenario\n[Detailed scenario description]\n\n## Tasks\n- Task 1: [Specific task]\n- Task 2: [Specific task]\n- Task 3: [Specific task]`,
      assessment: `# ${topic} Assessment\n\n## Overview\nThis assessment evaluates your mastery of ${topic} concepts and practical skills.\n\n## Assessment Criteria\n- Understanding of core concepts (40%)\n- Practical application (40%)\n- Critical thinking (20%)\n\n## Questions\n[Comprehensive assessment questions]`
    };
    
    return templates[type as keyof typeof templates] || templates.lesson;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Content copied to clipboard!');
  };

  const ContentGeneratorTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Content Generator
          </CardTitle>
          <CardDescription>
            Generate educational content automatically based on your specifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="Enter the topic for content generation"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
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
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
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
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                max="180"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="objectives">Learning Objectives (one per line)</Label>
            <Textarea
              id="objectives"
              placeholder="Enter learning objectives, one per line"
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              rows={4}
            />
          </div>
          
          <Button onClick={generateContent} disabled={loading} className="w-full">
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Generate Content
          </Button>
        </CardContent>
      </Card>
      
      {generatedContent.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Content Suggestions</h3>
          {generatedContent.map((suggestion) => (
            <Card key={suggestion.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{suggestion.title}</CardTitle>
                    <CardDescription>{suggestion.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{suggestion.type}</Badge>
                    <Badge variant={suggestion.difficulty === 'beginner' ? 'default' : 
                                  suggestion.difficulty === 'intermediate' ? 'secondary' : 'destructive'}>
                      {suggestion.difficulty}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {suggestion.estimatedTime} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {suggestion.learningObjectives.length} objectives
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Learning Objectives:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {suggestion.learningObjectives.map((obj, index) => (
                        <li key={index}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Generated Content:</h4>
                    <div className="bg-muted p-3 rounded-md text-sm max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{suggestion.content}</pre>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(suggestion.content)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    <Button size="sm">
                      Use This Content
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const ContentOptimizerTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Content Optimizer
          </CardTitle>
          <CardDescription>
            Analyze and optimize existing content for better learning outcomes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="existing-content">Existing Content</Label>
            <Textarea
              id="existing-content"
              placeholder="Paste your existing content here for analysis and optimization suggestions"
              value={existingContent}
              onChange={(e) => setExistingContent(e.target.value)}
              rows={8}
            />
          </div>
          
          <Button onClick={optimizeContent} disabled={loading} className="w-full">
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Analyze & Optimize
          </Button>
        </CardContent>
      </Card>
      
      {optimizationSuggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Optimization Suggestions</h3>
          {optimizationSuggestions.map((suggestion) => (
            <Card key={suggestion.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{suggestion.title}</CardTitle>
                    <CardDescription>{suggestion.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{suggestion.type}</Badge>
                    <Badge variant={suggestion.impact === 'high' ? 'destructive' : 
                                  suggestion.impact === 'medium' ? 'secondary' : 'default'}>
                      {suggestion.impact} impact
                    </Badge>
                    <Badge variant="outline">
                      {suggestion.effort} effort
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Suggestion:</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm">
                      Apply Suggestion
                    </Button>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const QuizGeneratorTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quiz Generator
          </CardTitle>
          <CardDescription>
            Automatically generate quizzes and assessments from your content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quiz-content">Source Content</Label>
            <Textarea
              id="quiz-content"
              placeholder="Paste the content you want to generate quiz questions from"
              value={quizContent}
              onChange={(e) => setQuizContent(e.target.value)}
              rows={6}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="quiz-type">Question Type</Label>
              <Select value={quizType} onValueChange={(value: any) => setQuizType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="true-false">True/False</SelectItem>
                  <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                  <SelectItem value="short-answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-count">Number of Questions</Label>
              <Input
                id="question-count"
                type="number"
                min="1"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiz-difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
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
          
          <Button onClick={generateQuiz} disabled={loading} className="w-full">
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PenTool className="h-4 w-4 mr-2" />
            )}
            Generate Quiz
          </Button>
        </CardContent>
      </Card>
      
      {generatedQuiz && (
        <Card>
          <CardHeader>
            <CardTitle>{generatedQuiz.title}</CardTitle>
            <CardDescription>{generatedQuiz.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedQuiz.questions.map((question: any, index: number) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <Badge variant="outline">{question.type}</Badge>
                  </div>
                  <p className="mb-3">{question.question}</p>
                  
                  {question.options && (
                    <div className="space-y-1 mb-3">
                      {question.options.map((option: string, optIndex: number) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <span className="text-sm font-mono">{String.fromCharCode(65 + optIndex)})</span>
                          <span className={optIndex === question.correctAnswer ? 'font-medium text-green-600' : ''}>
                            {option}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Button onClick={() => copyToClipboard(JSON.stringify(generatedQuiz, null, 2))}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Quiz
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Quiz
                </Button>
                <Button>
                  Add to Course
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const TranslationTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Content Translation
          </CardTitle>
          <CardDescription>
            Translate content to multiple languages with context awareness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source-lang">Source Language</Label>
              <Select 
                value={translationRequest.sourceLanguage} 
                onValueChange={(value) => setTranslationRequest(prev => ({ ...prev, sourceLanguage: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="ty">Tahitian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-lang">Target Language</Label>
              <Select 
                value={translationRequest.targetLanguage} 
                onValueChange={(value) => setTranslationRequest(prev => ({ ...prev, targetLanguage: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="ty">Tahitian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="translation-content">Content to Translate</Label>
            <Textarea
              id="translation-content"
              placeholder="Enter the content you want to translate"
              value={translationRequest.content}
              onChange={(e) => setTranslationRequest(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="translation-context">Context (Optional)</Label>
            <Input
              id="translation-context"
              placeholder="Provide context for better translation accuracy"
              value={translationRequest.context || ''}
              onChange={(e) => setTranslationRequest(prev => ({ ...prev, context: e.target.value }))}
            />
          </div>
          
          <Button onClick={translateContent} disabled={loading} className="w-full">
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Languages className="h-4 w-4 mr-2" />
            )}
            Translate Content
          </Button>
        </CardContent>
      </Card>
      
      {translatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Translation Result</CardTitle>
            <CardDescription>
              Translated from {translationRequest.sourceLanguage} to {translationRequest.targetLanguage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-sm">{translatedContent}</pre>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => copyToClipboard(translatedContent)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Translation
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button>
                  Use Translation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Content Creator</h1>
          <p className="text-muted-foreground">Generate, optimize, and translate educational content with AI</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="optimizer">Optimizer</TabsTrigger>
          <TabsTrigger value="quiz">Quiz Maker</TabsTrigger>
          <TabsTrigger value="translation">Translation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generator">
          <ContentGeneratorTab />
        </TabsContent>
        
        <TabsContent value="optimizer">
          <ContentOptimizerTab />
        </TabsContent>
        
        <TabsContent value="quiz">
          <QuizGeneratorTab />
        </TabsContent>
        
        <TabsContent value="translation">
          <TranslationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIContentCreator;