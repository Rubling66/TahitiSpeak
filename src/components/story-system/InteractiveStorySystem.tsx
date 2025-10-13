// InteractiveStorySystem Component - Main hub for the Interactive Polynesian Story System
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Library, 
  MessageCircle, 
  TrendingUp, 
  Compass,
  PenTool,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

// Import story system components
import { StoryLibrary } from './StoryLibrary';
import { InteractiveStoryReader } from './InteractiveStoryReader';
import { StoryDiscussions } from './StoryDiscussions';
import { CulturalContextHub } from './CulturalContextHub';
import { ProgressTracker } from './ProgressTracker';
import { StoryCreationStudio } from './StoryCreationStudio';

import type { Story } from '@/types/story-system';

type ViewMode = 'library' | 'reader' | 'discussions' | 'cultural-hub' | 'progress' | 'creation';

export function InteractiveStorySystem() {
  const [currentView, setCurrentView] = useState<ViewMode>('library');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  // Handle story selection from library
  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setSelectedStoryId(story.id);
    setCurrentView('reader');
  };

  // Handle opening discussions for a story
  const handleDiscussionOpen = (storyId: string) => {
    setSelectedStoryId(storyId);
    setCurrentView('discussions');
  };

  // Handle closing reader and returning to library
  const handleCloseReader = () => {
    setSelectedStory(null);
    setSelectedStoryId(null);
    setCurrentView('library');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Interactive Polynesian Stories</CardTitle>
                  <p className="text-gray-600">Explore authentic Pacific Island tales with cultural depth</p>
                </div>
              </div>
              {currentView !== 'library' && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('library')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Library
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {currentView !== 'reader' && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewMode)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="library" className="flex items-center gap-2">
                    <Library className="h-4 w-4" />
                    Library
                  </TabsTrigger>
                  <TabsTrigger value="cultural-hub" className="flex items-center gap-2">
                    <Compass className="h-4 w-4" />
                    Cultural Hub
                  </TabsTrigger>
                  <TabsTrigger value="discussions" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Discussions
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Progress
                  </TabsTrigger>
                  <TabsTrigger value="creation" className="flex items-center gap-2">
                    <PenTool className="h-4 w-4" />
                    Create
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {currentView === 'library' && (
            <StoryLibrary 
              onStorySelect={handleStorySelect}
              onDiscussionOpen={handleDiscussionOpen}
            />
          )}

          {currentView === 'reader' && selectedStoryId && (
            <InteractiveStoryReader 
              storyId={selectedStoryId}
              onClose={handleCloseReader}
              onDiscussionOpen={handleDiscussionOpen}
            />
          )}

          {currentView === 'discussions' && (
            <StoryDiscussions 
              storyId={selectedStoryId}
              onStorySelect={handleStorySelect}
            />
          )}

          {currentView === 'cultural-hub' && (
            <CulturalContextHub 
              storyId={selectedStoryId}
              onStorySelect={handleStorySelect}
            />
          )}

          {currentView === 'progress' && (
            <ProgressTracker 
              onStorySelect={handleStorySelect}
            />
          )}

          {currentView === 'creation' && (
            <StoryCreationStudio 
              onStoryCreated={(story) => {
                setSelectedStory(story);
                setCurrentView('library');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default InteractiveStorySystem;
