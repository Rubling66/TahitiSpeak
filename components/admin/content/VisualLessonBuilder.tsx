'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
  SortableContext as SortableContextType,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  GripVertical, 
  Type, 
  Image, 
  Volume2, 
  Video, 
  MessageSquare,
  BookOpen,
  Sparkles,
  Save,
  Eye,
  Trash2,
  Copy,
  Settings
} from 'lucide-react';

// Types for lesson components
interface LessonComponent {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'conversation' | 'vocabulary' | 'quiz';
  content: Record<string, unknown>;
  order: number;
  metadata?: {
    tahitian?: string;
    french?: string;
    english?: string;
    culturalContext?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  category: 'greeting' | 'vocabulary' | 'conversation' | 'cultural' | 'grammar';
  components: LessonComponent[];
  thumbnail?: string;
}

// Predefined lesson templates
const LESSON_TEMPLATES: LessonTemplate[] = [
  {
    id: 'basic-greeting',
    name: 'Basic Greetings',
    description: 'Introduction to common Tahitian greetings',
    category: 'greeting',
    components: [
      {
        id: 'intro-text',
        type: 'text',
        content: { 
          title: 'Ia Ora Na - Hello in Tahitian',
          description: 'Learn the most common greeting in Tahitian language'
        },
        order: 0,
        metadata: {
          tahitian: 'Ia ora na',
          french: 'Bonjour',
          english: 'Hello',
          difficulty: 'beginner'
        }
      },
      {
        id: 'pronunciation',
        type: 'audio',
        content: { 
          text: 'Ia ora na',
          audioUrl: '/audio/ia-ora-na.mp3'
        },
        order: 1
      },
      {
        id: 'practice-conversation',
        type: 'conversation',
        content: {
          scenario: 'Meeting someone for the first time',
          exchanges: [
            { speaker: 'A', text: 'Ia ora na!', translation: 'Hello!' },
            { speaker: 'B', text: 'Ia ora na! E aha tō oe i\'oa?', translation: 'Hello! What is your name?' }
          ]
        },
        order: 2
      }
    ]
  },
  {
    id: 'family-vocabulary',
    name: 'Family Members',
    description: 'Learn vocabulary for family relationships',
    category: 'vocabulary',
    components: [
      {
        id: 'family-intro',
        type: 'text',
        content: {
          title: 'Te \'Utuafare - The Family',
          description: 'Essential vocabulary for family members in Tahitian'
        },
        order: 0
      },
      {
        id: 'vocabulary-list',
        type: 'vocabulary',
        content: {
          words: [
            { tahitian: 'Metua', french: 'Parent', english: 'Parent' },
            { tahitian: 'Tamahine', french: 'Fille', english: 'Daughter' },
            { tahitian: 'Tamaiti', french: 'Enfant', english: 'Child' }
          ]
        },
        order: 1
      }
    ]
  }
];

// Component type definitions for the builder
const COMPONENT_TYPES = [
  { type: 'text', icon: Type, label: 'Text Content', description: 'Add text, titles, and descriptions' },
  { type: 'image', icon: Image, label: 'Image', description: 'Add cultural images and visual content' },
  { type: 'audio', icon: Volume2, label: 'Audio', description: 'Pronunciation and listening exercises' },
  { type: 'video', icon: Video, label: 'Video', description: 'Cultural videos and demonstrations' },
  { type: 'conversation', icon: MessageSquare, label: 'Conversation', description: 'Interactive dialogue practice' },
  { type: 'vocabulary', icon: BookOpen, label: 'Vocabulary', description: 'Word lists and definitions' },
];

// Sortable component item
interface SortableItemProps {
  component: LessonComponent;
  onEdit: (component: LessonComponent) => void;
  onDelete: (id: string) => void;
  onDuplicate: (component: LessonComponent) => void;
}

function SortableItem({ component, onEdit, onDelete, onDuplicate }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getComponentIcon = (type: string) => {
    const componentType = COMPONENT_TYPES.find(ct => ct.type === type);
    return componentType?.icon || Type;
  };

  const Icon = getComponentIcon(component.type);

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-gray-100"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <Icon className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-sm font-medium">
                  {component.type.charAt(0).toUpperCase() + component.type.slice(1)} Component
                </CardTitle>
                <CardDescription className="text-xs">
                  {component.metadata?.tahitian && (
                    <Badge variant="outline" className="mr-2">
                      {component.metadata.tahitian}
                    </Badge>
                  )}
                  Order: {component.order + 1}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(component)}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(component)}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(component.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-gray-600">
            {component.type === 'text' && (
              <div>
                <strong>{(component.content.title as string) || 'Untitled'}</strong>
                <p className="text-xs mt-1">{(component.content.description as string) || 'No description'}</p>
              </div>
            )}
            {component.type === 'vocabulary' && (
              <div>
                <strong>Vocabulary List</strong>
                <p className="text-xs mt-1">
                  {((component.content.words as Array<unknown>) || []).length} words
                </p>
              </div>
            )}
            {component.type === 'conversation' && (
              <div>
                <strong>{(component.content.scenario as string) || 'Conversation'}</strong>
                <p className="text-xs mt-1">
                  {((component.content.exchanges as Array<unknown>) || []).length} exchanges
                </p>
              </div>
            )}
            {(component.type === 'audio' || component.type === 'video') && (
              <div>
                <strong>Media Component</strong>
                <p className="text-xs mt-1">{(component.content.text as string) || 'No text'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Visual Lesson Builder Component
const VisualLessonBuilder = React.memo(function VisualLessonBuilder() {
  const [lessonComponents, setLessonComponents] = useState<LessonComponent[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLessonComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }

    setActiveId(null);
  }, []);

  const addComponent = useCallback((type: LessonComponent['type']) => {
    const newComponent: LessonComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: getDefaultContent(type),
      order: lessonComponents.length,
      metadata: {
        difficulty: 'beginner'
      }
    };

    setLessonComponents(prev => [...prev, newComponent]);
    setShowTemplates(false);
  }, [lessonComponents.length]);

  const deleteComponent = useCallback((id: string) => {
    setLessonComponents(prev => 
      prev.filter(comp => comp.id !== id)
        .map((comp, index) => ({ ...comp, order: index }))
    );
  }, []);

  const duplicateComponent = useCallback((component: LessonComponent) => {
    const newComponent: LessonComponent = {
      ...component,
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: lessonComponents.length,
    };

    setLessonComponents(prev => [...prev, newComponent]);
  }, [lessonComponents.length]);

  const editComponent = useCallback((component: LessonComponent) => {
    // TODO: Open edit modal/panel
    console.log('Edit component:', component);
  }, []);

  const loadTemplate = useCallback((template: LessonTemplate) => {
    setSelectedTemplate(template);
    setLessonTitle(template.name);
    setLessonDescription(template.description);
    setLessonComponents(template.components);
    setShowTemplates(false);
  }, []);

  const saveLesson = useCallback(() => {
    const lessonData = {
      title: lessonTitle,
      description: lessonDescription,
      components: lessonComponents,
      metadata: {
        createdAt: new Date().toISOString(),
        componentCount: lessonComponents.length,
        estimatedDuration: lessonComponents.length * 2 // 2 minutes per component
      }
    };

    console.log('Saving lesson:', lessonData);
    // TODO: Integrate with DataService to save lesson
  }, [lessonTitle, lessonDescription, lessonComponents]);

  const previewLesson = useCallback(() => {
    // TODO: Open lesson preview
    console.log('Preview lesson:', { title: lessonTitle, components: lessonComponents });
  }, [lessonTitle, lessonComponents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visual Lesson Builder</h1>
          <p className="text-gray-600 mt-1">Create interactive Tahitian lessons with drag-and-drop components</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={previewLesson} disabled={lessonComponents.length === 0}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={saveLesson} disabled={!lessonTitle || lessonComponents.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save Lesson
          </Button>
        </div>
      </div>

      <Tabs defaultValue={showTemplates ? "templates" : "builder"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" onClick={() => setShowTemplates(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="builder" onClick={() => setShowTemplates(false)}>
            <BookOpen className="h-4 w-4 mr-2" />
            Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Start with a pre-built template or create your lesson from scratch. Templates include cultural context and proper Tahitian language structure.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LESSON_TEMPLATES.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {template.components.length} components
                    </span>
                    <Button onClick={() => loadTemplate(template)} size="sm">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          {/* Lesson Info */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title
                </label>
                <Input
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Enter lesson title..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  placeholder="Brief description of the lesson..."
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Component Palette */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Components</CardTitle>
                  <CardDescription>Drag components to build your lesson</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {COMPONENT_TYPES.map((componentType) => {
                    const Icon = componentType.icon;
                    return (
                      <Button
                        key={componentType.type}
                        variant="outline"
                        className="w-full justify-start h-auto p-3"
                        onClick={() => addComponent(componentType.type as LessonComponent['type'])}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-0.5 text-blue-600" />
                          <div className="text-left">
                            <div className="font-medium text-sm">{componentType.label}</div>
                            <div className="text-xs text-gray-500">{componentType.description}</div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Lesson Builder Area */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Lesson Structure</CardTitle>
                      <CardDescription>
                        {lessonComponents.length} components • Drag to reorder
                      </CardDescription>
                    </div>
                    {lessonComponents.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLessonComponents([])}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {lessonComponents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No components yet</p>
                      <p className="text-sm">Add components from the palette to start building your lesson</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={lessonComponents.map(comp => comp.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {lessonComponents.map((component) => (
                          <SortableItem
                            key={component.id}
                            component={component}
                            onEdit={editComponent}
                            onDelete={deleteComponent}
                            onDuplicate={duplicateComponent}
                          />
                        ))}
                      </SortableContext>

                      <DragOverlay>
                        {activeId ? (
                          <div className="opacity-50">
                            <SortableItem
                              component={lessonComponents.find(comp => comp.id === activeId)!}
                              onEdit={() => {}}
                              onDelete={() => {}}
                              onDuplicate={() => {}}
                            />
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default VisualLessonBuilder;

// Helper function to get default content for component types
function getDefaultContent(type: LessonComponent['type']): Record<string, unknown> {
  switch (type) {
    case 'text':
      return {
        title: 'New Text Component',
        description: 'Add your content here...'
      };
    case 'vocabulary':
      return {
        words: [
          { tahitian: '', french: '', english: '' }
        ]
      };
    case 'conversation':
      return {
        scenario: 'New Conversation',
        exchanges: [
          { speaker: 'A', text: '', translation: '' },
          { speaker: 'B', text: '', translation: '' }
        ]
      };
    case 'audio':
    case 'video':
      return {
        text: '',
        url: ''
      };
    case 'image':
      return {
        url: '',
        caption: '',
        altText: ''
      };
    default:
      return {};
  }
}