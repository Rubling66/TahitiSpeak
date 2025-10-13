// StoryLibrary Component - Browse and filter stories with search functionality
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  Trophy,
  Play,
  Bookmark,
  MessageCircle
} from 'lucide-react';
import { useStories } from '@/hooks/useStories';
import type { 
  Story, 
  StoryCategory, 
  DifficultyLevel, 
  StorySortOption,
  StoryLibraryProps 
} from '@/types/story-system';

export function StoryLibrary({ 
  onStorySelect, 
  onDiscussionOpen 
}: StoryLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StoryCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<StorySortOption>('created_at');
  const [showFilters, setShowFilters] = useState(false);

  const { 
    stories, 
    loading, 
    error, 
    hasMore, 
    setFilters, 
    setSorting, 
    loadMore 
  } = useStories();

  // Apply filters when they change
  React.useEffect(() => {
    const filters = {
      search: searchQuery || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined
    };
    setFilters(filters);
  }, [searchQuery, selectedCategory, selectedDifficulty, setFilters]);

  // Apply sorting when it changes
  React.useEffect(() => {
    setSorting(sortBy);
  }, [sortBy, setSorting]);

  const categories: { value: StoryCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'mythology', label: 'Mythology' },
    { value: 'folklore', label: 'Folklore' },
    { value: 'history', label: 'History' },
    { value: 'legends', label: 'Legends' },
    { value: 'cultural_practices', label: 'Cultural Practices' }
  ];

  const difficulties: { value: DifficultyLevel | 'all'; label: string }[] = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const sortOptions: { value: StorySortOption; label: string }[] = [
    { value: 'created_at', label: 'Newest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'difficulty_level', label: 'Difficulty' },
    { value: 'estimated_duration', label: 'Duration' }
  ];

  const getCategoryColor = (category: StoryCategory): string => {
    const colors = {
      mythology: 'bg-purple-100 text-purple-800',
      folklore: 'bg-green-100 text-green-800',
      history: 'bg-blue-100 text-blue-800',
      legends: 'bg-orange-100 text-orange-800',
      cultural_practices: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: DifficultyLevel): string => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Polynesian Story Library
          </CardTitle>
          <p className="text-gray-600">
            Discover authentic Polynesian stories, myths, and cultural narratives
          </p>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search stories by title, description, or cultural elements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as StorySortOption)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={(value) => setSelectedCategory(value as StoryCategory | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <Select 
                    value={selectedDifficulty} 
                    onValueChange={(value) => setSelectedDifficulty(value as DifficultyLevel | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((difficulty) => (
                        <SelectItem key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && stories.length === 0 ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onSelect={() => onStorySelect(story.id)}
              onDiscussion={() => onDiscussionOpen?.(story.id)}
              getCategoryColor={getCategoryColor}
              getDifficultyColor={getDifficultyColor}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Load More Stories'}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && stories.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Stories Found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Story Card Component
interface StoryCardProps {
  story: Story;
  onSelect: () => void;
  onDiscussion: () => void;
  getCategoryColor: (category: StoryCategory) => string;
  getDifficultyColor: (difficulty: DifficultyLevel) => string;
}

function StoryCard({ 
  story, 
  onSelect, 
  onDiscussion, 
  getCategoryColor, 
  getDifficultyColor 
}: StoryCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
            {story.title}
          </CardTitle>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {story.average_rating?.toFixed(1) || '0.0'}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getCategoryColor(story.category)}>
            {story.category}
          </Badge>
          <Badge className={getDifficultyColor(story.difficulty_level)}>
            {story.difficulty_level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {story.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {story.estimated_duration} min
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {story.total_readers || 0}
            </div>
          </div>
          {story.cultural_authenticity_score && (
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              {story.cultural_authenticity_score}%
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onSelect}
            className="flex-1"
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Read Story
          </Button>
          <Button
            onClick={onDiscussion}
            variant="outline"
            size="sm"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}