'use client';

import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Edit, 
  Trash2, 
  Eye,
  Play,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  enrolledCount: number;
  rating: number;
  status: 'draft' | 'published' | 'archived';
  completionRate: number;
  lastModified: string;
  culturalContext?: {
    themes: string[];
    region: string;
  };
}

interface VirtualizedLessonListProps {
  lessons: Lesson[];
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lessonId: string) => void;
  onView?: (lesson: Lesson) => void;
  onPlay?: (lesson: Lesson) => void;
  height?: number;
  itemHeight?: number;
}

interface LessonItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    lessons: Lesson[];
    onEdit?: (lesson: Lesson) => void;
    onDelete?: (lessonId: string) => void;
    onView?: (lesson: Lesson) => void;
    onPlay?: (lesson: Lesson) => void;
  };
}

const LessonItem = React.memo<LessonItemProps>(({ index, style, data }) => {
  const { lessons, onEdit, onDelete, onView, onPlay } = data;
  const lesson = lessons[index];

  const handleEdit = useCallback(() => {
    onEdit?.(lesson);
  }, [lesson, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(lesson.id);
  }, [lesson.id, onDelete]);

  const handleView = useCallback(() => {
    onView?.(lesson);
  }, [lesson, onView]);

  const handlePlay = useCallback(() => {
    onPlay?.(lesson);
  }, [lesson, onPlay]);

  const getLevelColor = useCallback((level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'archived': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  }, []);

  return (
    <div style={style} className="px-4 py-2">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(lesson.status)}
                <h3 className="font-semibold text-lg truncate">{lesson.title}</h3>
                <Badge className={getLevelColor(lesson.level)}>
                  {lesson.level}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {lesson.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  {lesson.duration}min
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  {lesson.enrolledCount} enrolled
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {lesson.rating.toFixed(1)}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4" />
                  {lesson.completionRate}% complete
                </div>
              </div>

              {lesson.completionRate > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Completion Rate</span>
                    <span>{lesson.completionRate}%</span>
                  </div>
                  <Progress value={lesson.completionRate} className="h-2" />
                </div>
              )}

              {lesson.culturalContext && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {lesson.culturalContext.themes.slice(0, 3).map((theme, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                    {lesson.culturalContext.themes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{lesson.culturalContext.themes.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400">
                Last modified: {new Date(lesson.lastModified).toLocaleDateString()}
              </div>
            </div>

            <div className="flex flex-col gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={handleView}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              
              {lesson.status === 'published' && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handlePlay}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Play
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

LessonItem.displayName = 'LessonItem';

const VirtualizedLessonList = React.memo<VirtualizedLessonListProps>(({
  lessons,
  onEdit,
  onDelete,
  onView,
  onPlay,
  height = 600,
  itemHeight = 200
}) => {
  const itemData = useMemo(() => ({
    lessons,
    onEdit,
    onDelete,
    onView,
    onPlay
  }), [lessons, onEdit, onDelete, onView, onPlay]);

  if (lessons.length === 0) {
    return (
      <Card className="h-64 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons found</h3>
          <p className="text-gray-500">Create your first lesson to get started</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Lessons ({lessons.length.toLocaleString()})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <List
          height={height}
          itemCount={lessons.length}
          itemSize={itemHeight}
          itemData={itemData}
          overscanCount={5}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          {LessonItem}
        </List>
      </CardContent>
    </Card>
  );
});

VirtualizedLessonList.displayName = 'VirtualizedLessonList';

export default VirtualizedLessonList;
export type { Lesson, VirtualizedLessonListProps };