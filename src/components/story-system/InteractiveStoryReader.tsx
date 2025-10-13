// InteractiveStoryReader Component - Main story reading interface with branching navigation
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  MessageCircle, 
  Bookmark, 
  BookmarkCheck,
  Info,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Clock
} from 'lucide-react';
import { useStoryProgress } from '@/hooks/useStoryProgress';
import { useCulturalAnnotations } from '@/hooks/useCulturalAnnotations';
import { supabase } from '@/lib/supabase/client';
import type { 
  Story, 
  StoryPassage, 
  StoryChoice, 
  CulturalAnnotation,
  InteractiveStoryReaderProps 
} from '@/types/story-system';

export function InteractiveStoryReader({ 
  storyId, 
  onClose,
  onDiscussionOpen 
}: InteractiveStoryReaderProps) {
  const [story, setStory] = useState<Story>();
  const [currentPassage, setCurrentPassage] = useState<StoryPassage>();
  const [passages, setPassages] = useState<StoryPassage[]>([]);
  const [choices, setChoices] = useState<StoryChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selectedAnnotation, setSelectedAnnotation] = useState<CulturalAnnotation>();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { 
    progress, 
    updateProgress, 
    markCompleted, 
    addBookmark, 
    removeBookmark 
  } = useStoryProgress(storyId);

  const { 
    annotations, 
    markAsViewed, 
    getAnnotationsForPassage 
  } = useCulturalAnnotations(storyId);

  // Load story data
  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        setError(undefined);

        // Load story details
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single();

        if (storyError) throw storyError;

        // Load all passages for the story
        const { data: passagesData, error: passagesError } = await supabase
          .from('story_passages')
          .select('*')
          .eq('story_id', storyId)
          .order('order_index');

        if (passagesError) throw passagesError;

        // Load all choices for the story
        const { data: choicesData, error: choicesError } = await supabase
          .from('story_choices')
          .select('*')
          .eq('story_id', storyId);

        if (choicesError) throw choicesError;

        setStory(storyData as Story);
        setPassages(passagesData as StoryPassage[]);
        setChoices(choicesData as StoryChoice[]);

        // Set initial passage
        const startPassage = progress?.current_passage_id
          ? passagesData.find(p => p.id === progress.current_passage_id)
          : passagesData.find(p => p.is_start_passage);

        if (startPassage) {
          setCurrentPassage(startPassage as StoryPassage);
        }
      } catch (err) {
        console.error('Error loading story:', err);
        setError(err instanceof Error ? err.message : 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [storyId, progress]);

  // Check if current passage is bookmarked
  useEffect(() => {
    const checkBookmark = async () => {
      if (!currentPassage) return;

      try {
        const { data } = await supabase
          .from('story_bookmarks')
          .select('id')
          .eq('story_id', storyId)
          .eq('passage_id', currentPassage.id)
          .single();

        setIsBookmarked(!!data);
      } catch {
        setIsBookmarked(false);
      }
    };

    checkBookmark();
  }, [currentPassage, storyId]);

  // Navigate to a passage
  const navigateToPassage = async (passageId: string, choiceId?: string) => {
    const passage = passages.find(p => p.id === passageId);
    if (!passage) return;

    setCurrentPassage(passage);

    // Update progress
    const choiceMade = choiceId ? {
      choice_id: choiceId,
      passage_id: currentPassage?.id || '',
      selected_at: new Date().toISOString()
    } : undefined;

    await updateProgress(passageId, choiceMade ? [choiceMade] : undefined);

    // Check if story is completed
    if (passage.is_end_passage) {
      await markCompleted();
    }
  };

  // Get available choices for current passage
  const getCurrentChoices = (): StoryChoice[] => {
    if (!currentPassage) return [];
    return choices.filter(choice => choice.from_passage_id === currentPassage.id);
  };

  // Get annotations for current passage
  const getCurrentAnnotations = (): CulturalAnnotation[] => {
    if (!currentPassage) return [];
    return getAnnotationsForPassage(currentPassage.id);
  };

  // Handle annotation click
  const handleAnnotationClick = async (annotation: CulturalAnnotation) => {
    setSelectedAnnotation(annotation);
    await markAsViewed(annotation.id);
  };

  // Toggle bookmark
  const toggleBookmark = async () => {
    if (!currentPassage) return;

    try {
      if (isBookmarked) {
        await removeBookmark(currentPassage.id);
        setIsBookmarked(false);
      } else {
        await addBookmark(currentPassage.id);
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-gray-600">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story || !currentPassage) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error || 'Story not found'}</p>
          <Button onClick={onClose} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentChoices = getCurrentChoices();
  const currentAnnotations = getCurrentAnnotations();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Story Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{story.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Badge variant="secondary">{story.category}</Badge>
                <Badge variant="outline">{story.difficulty_level}</Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {story.estimated_duration} min
                </div>
                {progress && (
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {progress.completion_percentage}% complete
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBookmark}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDiscussionOpen?.(storyId)}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Library
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Story Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Passage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{currentPassage.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {currentPassage.content}
                  </p>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Story Choices */}
          {currentChoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What do you choose?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentChoices.map((choice) => (
                  <Button
                    key={choice.id}
                    variant="outline"
                    className="w-full text-left justify-start h-auto p-4"
                    onClick={() => navigateToPassage(choice.to_passage_id, choice.id)}
                  >
                    <div>
                      <div className="font-medium">{choice.choice_text}</div>
                      {choice.cultural_impact && (
                        <div className="text-sm text-gray-600 mt-1">
                          Cultural impact: {choice.cultural_impact}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* End of Story */}
          {currentPassage.is_end_passage && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold mb-2">Story Complete!</h3>
                <p className="text-gray-600 mb-4">
                  You have completed &quot;{story.title}&quot;
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={onClose}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Library
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => onDiscussionOpen?.(storyId)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Discuss Story
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cultural Annotations Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Cultural Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentAnnotations.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {currentAnnotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          annotation.is_viewed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        }`}
                        onClick={() => handleAnnotationClick(annotation)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {annotation.annotation_type}
                          </Badge>
                          {annotation.is_viewed && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              Viewed
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm mb-1">
                          {annotation.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-3">
                          {annotation.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  No cultural annotations for this passage
                </p>
              )}
            </CardContent>
          </Card>

          {/* Selected Annotation Detail */}
          {selectedAnnotation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedAnnotation.title}
                </CardTitle>
                <Badge variant="secondary">
                  {selectedAnnotation.annotation_type}
                </Badge>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">
                      {selectedAnnotation.content}
                    </p>
                    {selectedAnnotation.external_links.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Learn More:</h5>
                        <ul className="space-y-1">
                          {selectedAnnotation.external_links.map((link, index) => (
                            <li key={index}>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                {link}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <Separator className="my-4" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAnnotation(undefined)}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}