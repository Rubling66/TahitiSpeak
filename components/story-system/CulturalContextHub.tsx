// CulturalContextHub Component - Educational content and cultural information
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  BookOpen, 
  Globe, 
  Users, 
  Calendar,
  MapPin,
  Star,
  ExternalLink,
  Info,
  Award,
  Lightbulb
} from 'lucide-react';
import { useCulturalAnnotations } from '@/hooks/useCulturalAnnotations';
import { supabase, getCurrentUser } from '@/lib/supabase/client';
import type { 
  CulturalAnnotation, 
  AnnotationType,
  CulturalKnowledgePoint,
  CulturalContextHubProps 
} from '@/types/story-system';

export function CulturalContextHub({ onClose }: CulturalContextHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<AnnotationType | 'all'>('all');
  const [knowledgePoints, setKnowledgePoints] = useState<CulturalKnowledgePoint[]>([]);
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    categoriesExplored: 0,
    annotationsViewed: 0
  });

  const { 
    annotations, 
    loading, 
    error, 
    markAsViewed, 
    getAnnotationsByType 
  } = useCulturalAnnotations();

  // Load user knowledge points and stats
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        // Load knowledge points
        const { data: points } = await supabase
          .from('cultural_knowledge_points')
          .select('*')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false });

        if (points) {
          setKnowledgePoints(points);
          
          // Calculate stats
          const totalPoints = points.reduce((sum, point) => sum + point.points_earned, 0);
          const categoriesExplored = new Set(points.map(p => p.knowledge_category)).size;
          const annotationsViewed = points.length;

          setUserStats({
            totalPoints,
            categoriesExplored,
            annotationsViewed
          });
        }
      } catch (err) {
        console.error('Error loading user stats:', err);
      }
    };

    loadUserStats();
  }, []);

  // Filter annotations based on search and type
  const filteredAnnotations = annotations.filter(annotation => {
    const matchesSearch = !searchQuery || 
      annotation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      annotation.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || annotation.annotation_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Group annotations by type
  const annotationsByType = {
    cultural_practice: getAnnotationsByType('cultural_practice'),
    historical_context: getAnnotationsByType('historical_context'),
    language_note: getAnnotationsByType('language_note'),
    geographical_info: getAnnotationsByType('geographical_info'),
    spiritual_belief: getAnnotationsByType('spiritual_belief')
  };

  const annotationTypes: { value: AnnotationType | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All Types', icon: <Globe className="h-4 w-4" /> },
    { value: 'cultural_practice', label: 'Cultural Practices', icon: <Users className="h-4 w-4" /> },
    { value: 'historical_context', label: 'Historical Context', icon: <Calendar className="h-4 w-4" /> },
    { value: 'language_note', label: 'Language Notes', icon: <BookOpen className="h-4 w-4" /> },
    { value: 'geographical_info', label: 'Geography', icon: <MapPin className="h-4 w-4" /> },
    { value: 'spiritual_belief', label: 'Spiritual Beliefs', icon: <Star className="h-4 w-4" /> }
  ];

  const getTypeColor = (type: AnnotationType): string => {
    const colors = {
      cultural_practice: 'bg-blue-100 text-blue-800',
      historical_context: 'bg-green-100 text-green-800',
      language_note: 'bg-purple-100 text-purple-800',
      geographical_info: 'bg-orange-100 text-orange-800',
      spiritual_belief: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Globe className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-gray-600">Loading cultural context...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Globe className="h-6 w-6" />
                Cultural Context Hub
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Explore Polynesian culture, traditions, and knowledge
              </p>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* User Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Cultural Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {userStats.totalPoints}
              </div>
              <div className="text-sm text-gray-600">Knowledge Points</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {userStats.categoriesExplored}
              </div>
              <div className="text-sm text-gray-600">Categories Explored</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {userStats.annotationsViewed}
              </div>
              <div className="text-sm text-gray-600">Annotations Viewed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cultural content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {annotationTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  className="flex items-center gap-2"
                >
                  {type.icon}
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="explore" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="recent">Recent Learning</TabsTrigger>
        </TabsList>

        {/* Explore Tab */}
        <TabsContent value="explore" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnotations.map((annotation) => (
              <AnnotationCard
                key={annotation.id}
                annotation={annotation}
                onView={() => markAsViewed(annotation.id)}
                getTypeColor={getTypeColor}
              />
            ))}
          </div>
          
          {filteredAnnotations.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Lightbulb className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Content Found</h3>
                <p className="text-gray-600">
                  Try adjusting your search or explore different categories
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {annotationTypes.slice(1).map((type) => {
            const typeAnnotations = annotationsByType[type.value as AnnotationType] || [];
            if (typeAnnotations.length === 0) return null;

            return (
              <Card key={type.value}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {type.icon}
                    {type.label}
                    <Badge variant="secondary">{typeAnnotations.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {typeAnnotations.slice(0, 4).map((annotation) => (
                      <AnnotationCard
                        key={annotation.id}
                        annotation={annotation}
                        onView={() => markAsViewed(annotation.id)}
                        getTypeColor={getTypeColor}
                        compact
                      />
                    ))}
                  </div>
                  {typeAnnotations.length > 4 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedType(type.value as AnnotationType)}
                      >
                        View All {typeAnnotations.length} Items
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Recent Learning Tab */}
        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Knowledge Points</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {knowledgePoints.slice(0, 20).map((point) => (
                    <div
                      key={point.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {point.knowledge_category.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(point.earned_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline">
                        +{point.points_earned} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Annotation Card Component
interface AnnotationCardProps {
  annotation: CulturalAnnotation;
  onView: () => void;
  getTypeColor: (type: AnnotationType) => string;
  compact?: boolean;
}

function AnnotationCard({ 
  annotation, 
  onView, 
  getTypeColor, 
  compact = false 
}: AnnotationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (!annotation.is_viewed) {
      onView();
    }
    if (!compact) {
      setExpanded(!expanded);
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        annotation.is_viewed ? 'bg-green-50 border-green-200' : 'hover:bg-blue-50'
      }`}
      onClick={handleClick}
    >
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex items-start justify-between">
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} line-clamp-2`}>
            {annotation.title}
          </CardTitle>
          {annotation.is_viewed && (
            <Badge variant="outline" className="text-xs text-green-600">
              Viewed
            </Badge>
          )}
        </div>
        <Badge className={getTypeColor(annotation.annotation_type)}>
          {annotation.annotation_type.replace('_', ' ')}
        </Badge>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <p className={`text-gray-600 ${compact ? 'text-sm line-clamp-2' : 'line-clamp-3'}`}>
          {annotation.content}
        </p>
        
        {expanded && !compact && (
          <div className="mt-4 space-y-3">
            <Separator />
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{annotation.content}</p>
            </div>
            
            {annotation.external_links.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Learn More
                </h5>
                <div className="space-y-1">
                  {annotation.external_links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {!compact && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>Click to {expanded ? 'collapse' : 'expand'}</span>
            {!annotation.is_viewed && (
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                New
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}