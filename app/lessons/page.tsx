'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, BookOpen, Clock, Users, ArrowRight } from 'lucide-react';
import { JSONDataService } from '@/lib/data/JSONDataService';
import { Lesson, LessonLevel } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AuthenticatedLayout } from '@/components/layout/AppLayout';
import { PageErrorBoundary, SectionErrorBoundary } from '@/components/error/ErrorBoundary';

const LessonsPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LessonLevel | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');

  const dataService = new JSONDataService();

  useEffect(() => {
    loadLessons();
  }, []);

  useEffect(() => {
    filterLessons();
  }, [lessons, searchQuery, selectedLevel, selectedTag]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const allLessons = await dataService.getLessons();
      setLessons(allLessons);
      setError(null);
    } catch (err) {
      console.error('Error loading lessons:', err);
      setError('Failed to load lessons. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterLessons = () => {
    let filtered = [...lessons];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lesson => 
        lesson.title.fr.toLowerCase().includes(query) ||
        lesson.title.tah?.toLowerCase().includes(query) ||
        lesson.title.en?.toLowerCase().includes(query) ||
        lesson.summary.toLowerCase().includes(query) ||
        lesson.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by level
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(lesson => lesson.level === selectedLevel);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(lesson => lesson.tags?.includes(selectedTag));
    }

    setFilteredLessons(filtered);
  };

  const getAllTags = () => {
    const tags = new Set<string>();
    lessons.forEach(lesson => {
      lesson.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  };

  const getLevelBadgeVariant = (level: LessonLevel) => {
    switch (level) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'danger';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lessons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Lessons</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadLessons}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <PageErrorBoundary component="LessonsPage">
        <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <SectionErrorBoundary component="LessonsHeader">
          <header className="bg-white shadow-sm border-b" role="banner">
            <div className="max-w-6xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">All Lessons</h1>
                  <p className="text-gray-600 mt-1">
                    {filteredLessons.length} of {lessons.length} lessons
                  </p>
                </div>
                
                <Link href="/">
                  <Button variant="outline" aria-label="Go back to homepage">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </header>
        </SectionErrorBoundary>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Featured Tropical Experience */}
          <SectionErrorBoundary component="TropicalFeature">
            <div className="mb-8">
              <Card className="bg-gradient-to-r from-tropical-ocean to-tropical-lagoon text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">🌺 Tropical Learning Experience</h2>
                          <p className="text-white/90">Immersive island-style lesson interface</p>
                        </div>
                      </div>
                      <p className="text-white/80 mb-6 max-w-2xl">
                        Experience our new tropical-themed lesson interface with beautiful island backgrounds, 
                        interactive vocabulary cards, and AI-powered pronunciation coaching in a paradise setting.
                      </p>
                      <Link href="/lessons/tropical">
                        <Button 
                          variant="secondary" 
                          className="bg-white text-tropical-ocean hover:bg-tropical-sand transition-colors"
                          aria-label="Try the tropical learning experience"
                        >
                          🏝️ Try Tropical Experience
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-6xl opacity-20">🌴</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SectionErrorBoundary>

          {/* Filters */}
          <SectionErrorBoundary component="LessonsFilters">
            <div className="mb-8" aria-labelledby="filters-heading">
          <Card>
            <CardContent className="p-6">
              <h3 id="filters-heading" className="sr-only">Filter and search lessons</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="group" aria-label="Lesson filters">
                {/* Search */}
                <div className="md:col-span-2">
                  <Input
                    variant="search"
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search lessons by title or content"
                  />
                </div>
                
                {/* Level Filter */}
                <div>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value as LessonLevel | 'all')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Filter by difficulty level"
                  >
                    <option value="all">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                
                {/* Tag Filter */}
                <div>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Filter by topic"
                  >
                    <option value="all">All Topics</option>
                    {getAllTags().map(tag => (
                      <option key={tag} value={tag}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </SectionErrorBoundary>

          {/* Lessons Grid */}
          <SectionErrorBoundary component="LessonsGrid">
            {filteredLessons.length === 0 ? (
              <div className="text-center py-12" role="status" aria-live="polite">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No lessons found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="List of available lessons">
            {filteredLessons.map((lesson) => (
              <Card key={lesson.id} className="h-full hover:shadow-md transition-shadow" role="listitem">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant={getLevelBadgeVariant(lesson.level)} 
                      size="sm"
                      aria-label={`Difficulty level: ${lesson.level}`}
                    >
                      {lesson.level}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span aria-label={`Estimated duration: ${lesson.durationMin} minutes`}>{lesson.durationMin} min</span>
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg mb-2">
                    {lesson.title.fr}
                  </CardTitle>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {lesson.title.tah}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {lesson.summary}
                  </p>
                  
                  {/* Tags */}
                  {lesson.tags && lesson.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4" role="list" aria-label="Lesson topics">
                      {lesson.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" size="sm" role="listitem">
                          {tag}
                        </Badge>
                      ))}
                      {lesson.tags.length > 3 && (
                        <Badge variant="secondary" size="sm" role="listitem" aria-label={`${lesson.tags.length - 3} more topics`}>
                          +{lesson.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" aria-hidden="true" />
                      <span aria-label={`${lesson.sections.filter(s => s.kind === 'Vocabulary').length} vocabulary sections`}>{lesson.sections.filter(s => s.kind === 'Vocabulary').length} vocab</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" aria-hidden="true" />
                      <span aria-label={`${lesson.sections.length} lesson sections`}>{lesson.sections.length} sections</span>
                    </div>
                  </div>
                  
                  <Link href={`/lessons/${lesson.slug}`}>
                    <Button variant="primary" className="w-full flex items-center justify-center gap-2" aria-label={`Start lesson: ${lesson.title.fr}`}>
                      Start Lesson
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
              </div>
            )}
          </SectionErrorBoundary>
        </div>
        </div>
      </PageErrorBoundary>
    </AuthenticatedLayout>
  );
};

export default LessonsPage;