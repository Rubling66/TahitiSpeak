'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  Globe,
  Volume2,
  Star,
  Loader2
} from 'lucide-react';
import TahitianAIService, { 
  LessonPlanRequest, 
  LessonPlan, 
  GrammarCheckResult, 
  CulturalContext,
  AIContentQuality 
} from '@/services/ai/TahitianAIService';
import { toast } from 'sonner';

interface AIContentAssistantProps {
  onLessonGenerated?: (lesson: LessonPlan) => void;
  onContentInsert?: (content: string) => void;
  currentContent?: string;
}

export const AIContentAssistant: React.FC<AIContentAssistantProps> = ({
  onLessonGenerated,
  onContentInsert,
  currentContent = ''
}) => {
  const [activeTab, setActiveTab] = useState('lesson-generator');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<LessonPlan | null>(null);
  const [grammarResult, setGrammarResult] = useState<GrammarCheckResult | null>(null);
  const [culturalContext, setCulturalContext] = useState<CulturalContext | null>(null);
  const [contentQuality, setContentQuality] = useState<AIContentQuality | null>(null);

  // Lesson Generator State
  const [lessonRequest, setLessonRequest] = useState<LessonPlanRequest>({
    topic: '',
    level: 'beginner',
    duration: 45,
    culturalFocus: true,
    objectives: []
  });

  // Grammar Check State
  const [grammarText, setGrammarText] = useState('');
  const [grammarLanguage, setGrammarLanguage] = useState<'tahitian' | 'french'>('tahitian');

  // Cultural Context State
  const [culturalPhrase, setCulturalPhrase] = useState('');

  const handleGenerateLesson = useCallback(async () => {
    if (!lessonRequest.topic.trim()) {
      toast.error('Please enter a lesson topic');
      return;
    }

    setIsLoading(true);
    try {
      const lesson = await TahitianAIService.generateLessonPlan(lessonRequest);
      setGeneratedLesson(lesson);
      onLessonGenerated?.(lesson);
      toast.success('Lesson plan generated successfully!');
    } catch (error) {
      console.error('Lesson generation error:', error);
      toast.error('Failed to generate lesson plan');
    } finally {
      setIsLoading(false);
    }
  }, [lessonRequest, onLessonGenerated]);

  const handleGrammarCheck = useCallback(async () => {
    if (!grammarText.trim()) {
      toast.error('Please enter text to check');
      return;
    }

    setIsLoading(true);
    try {
      const result = await TahitianAIService.grammarCheck(grammarText, grammarLanguage);
      setGrammarResult(result);
      
      if (result.isCorrect) {
        toast.success('Grammar looks good!');
      } else {
        toast.info(`Found ${result.corrections.length} suggestions`);
      }
    } catch (error) {
      console.error('Grammar check error:', error);
      toast.error('Failed to check grammar');
    } finally {
      setIsLoading(false);
    }
  }, [grammarText, grammarLanguage]);

  const handleCulturalContext = useCallback(async () => {
    if (!culturalPhrase.trim()) {
      toast.error('Please enter a phrase');
      return;
    }

    setIsLoading(true);
    try {
      const context = await TahitianAIService.getCulturalContext(culturalPhrase);
      setCulturalContext(context);
      toast.success('Cultural context retrieved!');
    } catch (error) {
      console.error('Cultural context error:', error);
      toast.error('Failed to get cultural context');
    } finally {
      setIsLoading(false);
    }
  }, [culturalPhrase]);

  const handleContentQualityCheck = useCallback(async () => {
    if (!currentContent.trim()) {
      toast.error('No content to evaluate');
      return;
    }

    setIsLoading(true);
    try {
      const quality = await TahitianAIService.evaluateContentQuality(currentContent, 'lesson');
      setContentQuality(quality);
      toast.success('Content quality evaluated!');
    } catch (error) {
      console.error('Content quality error:', error);
      toast.error('Failed to evaluate content quality');
    } finally {
      setIsLoading(false);
    }
  }, [currentContent]);

  const insertLessonContent = useCallback((lesson: LessonPlan) => {
    const content = `
# ${lesson.title}

**Level:** ${lesson.level} | **Duration:** ${lesson.duration} minutes

## Description
${lesson.description}

## Cultural Context
${lesson.culturalContext}

## Learning Objectives
${lesson.objectives.map(obj => `- ${obj}`).join('\n')}

## Vocabulary
${lesson.vocabulary.map(vocab => 
  `**${vocab.tahitian}** (${vocab.pronunciation}) - ${vocab.french} / ${vocab.english}${vocab.culturalNote ? `\n*Cultural Note: ${vocab.culturalNote}*` : ''}`
).join('\n\n')}

## Activities
${lesson.activities.map((activity, index) => 
  `### ${index + 1}. ${activity.title} (${activity.duration} min)
${activity.description}

**Instructions:**
${activity.instructions.map(inst => `- ${inst}`).join('\n')}
${activity.materials ? `\n**Materials:** ${activity.materials.join(', ')}` : ''}`
).join('\n\n')}

## Assessment Criteria
${lesson.assessmentCriteria.map(criteria => `- ${criteria}`).join('\n')}

## Cultural Notes
${lesson.culturalNotes.map(note => `- ${note}`).join('\n')}

${lesson.homework ? `## Homework\n${lesson.homework.map(hw => `- ${hw}`).join('\n')}` : ''}
    `.trim();

    onContentInsert?.(content);
    toast.success('Lesson content inserted!');
  }, [onContentInsert]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Content Assistant
        </CardTitle>
        <CardDescription>
          AI-powered tools for creating authentic Tahitian language content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lesson-generator" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Lesson Generator
            </TabsTrigger>
            <TabsTrigger value="grammar-check" className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Grammar Check
            </TabsTrigger>
            <TabsTrigger value="cultural-context" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Cultural Context
            </TabsTrigger>
            <TabsTrigger value="quality-check" className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              Quality Check
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lesson-generator" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Lesson Topic</label>
                  <Textarea
                    placeholder="e.g., Tahitian greetings and introductions"
                    value={lessonRequest.topic}
                    onChange={(e) => setLessonRequest(prev => ({ ...prev, topic: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Level</label>
                    <Select 
                      value={lessonRequest.level} 
                      onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                        setLessonRequest(prev => ({ ...prev, level: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Select 
                      value={lessonRequest.duration?.toString()} 
                      onValueChange={(value) => 
                        setLessonRequest(prev => ({ ...prev, duration: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="cultural-focus"
                    checked={lessonRequest.culturalFocus}
                    onChange={(e) => setLessonRequest(prev => ({ ...prev, culturalFocus: e.target.checked }))}
                  />
                  <label htmlFor="cultural-focus" className="text-sm font-medium">
                    Include cultural focus
                  </label>
                </div>

                <Button 
                  onClick={handleGenerateLesson} 
                  disabled={isLoading || !lessonRequest.topic.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Lesson Plan
                    </>
                  )}
                </Button>
              </div>

              {generatedLesson && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{generatedLesson.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{generatedLesson.level}</Badge>
                        <Badge variant="outline">{generatedLesson.duration} min</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {generatedLesson.description}
                      </p>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Objectives:</h4>
                        <ul className="text-sm space-y-1">
                          {generatedLesson.objectives.map((obj, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium">Vocabulary ({generatedLesson.vocabulary.length} items):</h4>
                        <div className="grid grid-cols-1 gap-1 text-sm">
                          {generatedLesson.vocabulary.slice(0, 3).map((vocab, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="font-medium">{vocab.tahitian}</span>
                              <span className="text-muted-foreground">- {vocab.french}</span>
                            </div>
                          ))}
                          {generatedLesson.vocabulary.length > 3 && (
                            <span className="text-muted-foreground">
                              +{generatedLesson.vocabulary.length - 3} more...
                            </span>
                          )}
                        </div>
                      </div>

                      <Button 
                        onClick={() => insertLessonContent(generatedLesson)}
                        className="w-full mt-4"
                        variant="outline"
                      >
                        Insert into Editor
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="grammar-check" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Select 
                    value={grammarLanguage} 
                    onValueChange={(value: 'tahitian' | 'french') => setGrammarLanguage(value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tahitian">Tahitian</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Text to Check</label>
                  <Textarea
                    placeholder="Enter text for grammar checking..."
                    value={grammarText}
                    onChange={(e) => setGrammarText(e.target.value)}
                    className="mt-1 min-h-[120px]"
                  />
                </div>

                <Button 
                  onClick={handleGrammarCheck} 
                  disabled={isLoading || !grammarText.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check Grammar
                    </>
                  )}
                </Button>
              </div>

              {grammarResult && (
                <div className="space-y-4">
                  <Alert className={grammarResult.isCorrect ? "border-green-200" : "border-yellow-200"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {grammarResult.isCorrect 
                        ? "Grammar looks good!" 
                        : `Found ${grammarResult.corrections.length} suggestions`
                      }
                      <div className="mt-2">
                        <span className="text-sm">Confidence: {grammarResult.confidence}%</span>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {grammarResult.corrections.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Corrections</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {grammarResult.corrections.map((correction, index) => (
                          <div key={index} className="border-l-4 border-blue-200 pl-4">
                            <div className="text-sm">
                              <span className="line-through text-red-500">{correction.original}</span>
                              {' → '}
                              <span className="text-green-600 font-medium">{correction.corrected}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {correction.explanation}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {correction.rule}
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {grammarResult.suggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Suggestions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {grammarResult.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cultural-context" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tahitian Phrase</label>
                  <Textarea
                    placeholder="Enter a Tahitian phrase or expression..."
                    value={culturalPhrase}
                    onChange={(e) => setCulturalPhrase(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleCulturalContext} 
                  disabled={isLoading || !culturalPhrase.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Get Cultural Context
                    </>
                  )}
                </Button>
              </div>

              {culturalContext && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">"{culturalContext.phrase}"</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Meaning</h4>
                        <p className="text-sm">{culturalContext.meaning}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Cultural Significance</h4>
                        <p className="text-sm">{culturalContext.culturalSignificance}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Usage</h4>
                        <p className="text-sm">{culturalContext.usage}</p>
                      </div>

                      {culturalContext.examples.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Examples</h4>
                          <ul className="space-y-1">
                            {culturalContext.examples.map((example, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                • {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {culturalContext.respectfulUsage.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Respectful Usage Guidelines</h4>
                          <ul className="space-y-1">
                            {culturalContext.respectfulUsage.map((guideline, index) => (
                              <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {guideline}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="quality-check" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This tool evaluates the current content in your editor for cultural accuracy, 
                  linguistic correctness, pedagogical value, and engagement.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleContentQualityCheck} 
                disabled={isLoading || !currentContent.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Evaluate Content Quality
                  </>
                )}
              </Button>

              {contentQuality && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Content Quality Score
                        <Badge variant={contentQuality.score >= 80 ? "default" : contentQuality.score >= 60 ? "secondary" : "destructive"}>
                          {contentQuality.score}/100
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Cultural Accuracy</span>
                            <span>{contentQuality.criteria.culturalAccuracy}%</span>
                          </div>
                          <Progress value={contentQuality.criteria.culturalAccuracy} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Linguistic Correctness</span>
                            <span>{contentQuality.criteria.linguisticCorrectness}%</span>
                          </div>
                          <Progress value={contentQuality.criteria.linguisticCorrectness} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Pedagogical Value</span>
                            <span>{contentQuality.criteria.pedagogicalValue}%</span>
                          </div>
                          <Progress value={contentQuality.criteria.pedagogicalValue} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Engagement</span>
                            <span>{contentQuality.criteria.engagement}%</span>
                          </div>
                          <Progress value={contentQuality.criteria.engagement} className="h-2" />
                        </div>
                      </div>

                      {contentQuality.feedback.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-green-700">Strengths</h4>
                          <ul className="space-y-1">
                            {contentQuality.feedback.map((feedback, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {feedback}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {contentQuality.improvements.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-blue-700">Improvements</h4>
                          <ul className="space-y-1">
                            {contentQuality.improvements.map((improvement, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <Lightbulb className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIContentAssistant;