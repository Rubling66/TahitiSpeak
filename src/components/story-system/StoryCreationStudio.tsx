// StoryCreationStudio Component - Tool for cultural contributors to create authentic stories
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Users,
  Globe,
  Calendar,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  Edit
} from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase/client';
import type { 
  StoryCategory, 
  DifficultyLevel, 
  AnnotationType,
  StoryCreationData,
  StoryPassageCreation,
  StoryChoiceCreation,
  CulturalAnnotationCreation,
  StoryCreationStudioProps 
} from '@/types/story-system';

export function StoryCreationStudio({ onClose }: StoryCreationStudioProps) {
  const [currentTab, setCurrentTab] = useState('story');
  const [storyData, setStoryData] = useState<StoryCreationData>({
    title: '',
    description: '',
    category: 'folklore',
    difficulty_level: 'beginner',
    estimated_duration: 10,
    cultural_authenticity_score: 85,
    is_published: false
  });
  
  const [passages, setPassages] = useState<StoryPassageCreation[]>([
    {
      title: 'Beginning',
      content: '',
      order_index: 0,
      is_start_passage: true,
      is_end_passage: false
    }
  ]);
  
  const [choices, setChoices] = useState<StoryChoiceCreation[]>([]);
  const [annotations, setAnnotations] = useState<CulturalAnnotationCreation[]>([]);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Add new passage
  const addPassage = () => {
    const newPassage: StoryPassageCreation = {
      title: `Passage ${passages.length + 1}`,
      content: '',
      order_index: passages.length,
      is_start_passage: false,
      is_end_passage: false
    };
    setPassages([...passages, newPassage]);
  };

  // Update passage
  const updatePassage = (index: number, updates: Partial<StoryPassageCreation>) => {
    const updatedPassages = [...passages];
    updatedPassages[index] = { ...updatedPassages[index], ...updates };
    setPassages(updatedPassages);
  };

  // Delete passage
  const deletePassage = (index: number) => {
    if (passages.length <= 1) return; // Keep at least one passage
    
    const updatedPassages = passages.filter((_, i) => i !== index);
    // Update order indices
    updatedPassages.forEach((passage, i) => {
      passage.order_index = i;
    });
    
    setPassages(updatedPassages);
    
    // Remove choices that reference deleted passage
    setChoices(choices.filter(choice => 
      choice.from_passage_index !== index && choice.to_passage_index !== index
    ));
    
    // Remove annotations for deleted passage
    setAnnotations(annotations.filter(annotation => 
      annotation.passage_index !== index
    ));
    
    // Adjust current passage index if needed
    if (currentPassageIndex >= updatedPassages.length) {
      setCurrentPassageIndex(Math.max(0, updatedPassages.length - 1));
    }
  };

  // Add choice
  const addChoice = () => {
    const newChoice: StoryChoiceCreation = {
      choice_text: '',
      from_passage_index: currentPassageIndex,
      to_passage_index: 0,
      cultural_impact: ''
    };
    setChoices([...choices, newChoice]);
  };

  // Update choice
  const updateChoice = (index: number, updates: Partial<StoryChoiceCreation>) => {
    const updatedChoices = [...choices];
    updatedChoices[index] = { ...updatedChoices[index], ...updates };
    setChoices(updatedChoices);
  };

  // Delete choice
  const deleteChoice = (index: number) => {
    setChoices(choices.filter((_, i) => i !== index));
  };

  // Add annotation
  const addAnnotation = () => {
    const newAnnotation: CulturalAnnotationCreation = {
      title: '',
      content: '',
      annotation_type: 'cultural_practice',
      passage_index: currentPassageIndex,
      external_links: []
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  // Update annotation
  const updateAnnotation = (index: number, updates: Partial<CulturalAnnotationCreation>) => {
    const updatedAnnotations = [...annotations];
    updatedAnnotations[index] = { ...updatedAnnotations[index], ...updates };
    setAnnotations(updatedAnnotations);
  };

  // Delete annotation
  const deleteAnnotation = (index: number) => {
    setAnnotations(annotations.filter((_, i) => i !== index));
  };

  // Validate story data
  const validateStory = (): string[] => {
    const validationErrors: string[] = [];
    
    if (!storyData.title.trim()) {
      validationErrors.push('Story title is required');
    }
    
    if (!storyData.description.trim()) {
      validationErrors.push('Story description is required');
    }
    
    if (passages.length === 0) {
      validationErrors.push('At least one passage is required');
    }
    
    const hasStartPassage = passages.some(p => p.is_start_passage);
    if (!hasStartPassage) {
      validationErrors.push('One passage must be marked as the start passage');
    }
    
    const hasEndPassage = passages.some(p => p.is_end_passage);
    if (!hasEndPassage) {
      validationErrors.push('At least one passage must be marked as an end passage');
    }
    
    passages.forEach((passage, index) => {
      if (!passage.title.trim()) {
        validationErrors.push(`Passage ${index + 1} title is required`);
      }
      if (!passage.content.trim()) {
        validationErrors.push(`Passage ${index + 1} content is required`);
      }
    });
    
    return validationErrors;
  };

  // Save story
  const saveStory = async (publish: boolean = false) => {
    setSaving(true);
    setErrors([]);
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const validationErrors = validateStory();
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }
      
      // Create story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          ...storyData,
          author_id: user.id,
          is_published: publish,
          total_readers: 0,
          average_rating: 0
        })
        .select()
        .single();
      
      if (storyError) throw storyError;
      
      // Create passages
      const passagePromises = passages.map(async (passage, index) => {
        const { data: createdPassage, error: passageError } = await supabase
          .from('story_passages')
          .insert({
            story_id: story.id,
            title: passage.title,
            content: passage.content,
            order_index: passage.order_index,
            is_start_passage: passage.is_start_passage,
            is_end_passage: passage.is_end_passage
          })
          .select()
          .single();
        
        if (passageError) throw passageError;
        return { ...createdPassage, originalIndex: index };
      });
      
      const createdPassages = await Promise.all(passagePromises);
      
      // Create choices
      if (choices.length > 0) {
        const choicePromises = choices.map(async (choice) => {
          const fromPassage = createdPassages.find(p => p.originalIndex === choice.from_passage_index);
          const toPassage = createdPassages.find(p => p.originalIndex === choice.to_passage_index);
          
          if (!fromPassage || !toPassage) return;
          
          return supabase
            .from('story_choices')
            .insert({
              story_id: story.id,
              from_passage_id: fromPassage.id,
              to_passage_id: toPassage.id,
              choice_text: choice.choice_text,
              cultural_impact: choice.cultural_impact || null
            });
        });
        
        await Promise.all(choicePromises.filter(Boolean));
      }
      
      // Create annotations
      if (annotations.length > 0) {
        const annotationPromises = annotations.map(async (annotation) => {
          const passage = createdPassages.find(p => p.originalIndex === annotation.passage_index);
          if (!passage) return;
          
          return supabase
            .from('cultural_annotations')
            .insert({
              story_id: story.id,
              passage_id: passage.id,
              title: annotation.title,
              content: annotation.content,
              annotation_type: annotation.annotation_type,
              external_links: annotation.external_links
            });
        });
        
        await Promise.all(annotationPromises.filter(Boolean));
      }
      
      // Success
      alert(publish ? 'Story published successfully!' : 'Story saved as draft!');
      if (onClose) onClose();
      
    } catch (err) {
      console.error('Error saving story:', err);
      setErrors([err instanceof Error ? err.message : 'Failed to save story']);
    } finally {
      setSaving(false);
    }
  };

  const categories: { value: StoryCategory; label: string }[] = [
    { value: 'mythology', label: 'Mythology' },
    { value: 'folklore', label: 'Folklore' },
    { value: 'history', label: 'History' },
    { value: 'legends', label: 'Legends' },
    { value: 'cultural_practices', label: 'Cultural Practices' }
  ];

  const difficulties: { value: DifficultyLevel; label: string }[] = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const annotationTypes: { value: AnnotationType; label: string }[] = [
    { value: 'cultural_practice', label: 'Cultural Practice' },
    { value: 'historical_context', label: 'Historical Context' },
    { value: 'language_note', label: 'Language Note' },
    { value: 'geographical_info', label: 'Geographical Info' },
    { value: 'spiritual_belief', label: 'Spiritual Belief' }
  ];

  const currentPassage = passages[currentPassageIndex];
  const currentPassageChoices = choices.filter(c => c.from_passage_index === currentPassageIndex);
  const currentPassageAnnotations = annotations.filter(a => a.passage_index === currentPassageIndex);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Edit className="h-6 w-6" />
                Story Creation Studio
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Create authentic Polynesian stories with cultural annotations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => saveStory(false)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => saveStory(true)}
                disabled={saving}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish Story
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">Please fix the following errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="story">Story Details</TabsTrigger>
          <TabsTrigger value="passages">Passages ({passages.length})</TabsTrigger>
          <TabsTrigger value="choices">Choices ({choices.length})</TabsTrigger>
          <TabsTrigger value="annotations">Annotations ({annotations.length})</TabsTrigger>
        </TabsList>

        {/* Story Details Tab */}
        <TabsContent value="story" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    placeholder="Enter story title"
                    value={storyData.title}
                    onChange={(e) => setStoryData({ ...storyData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <Select
                    value={storyData.category}
                    onValueChange={(value) => setStoryData({ ...storyData, category: value as StoryCategory })}
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
                  <label className="block text-sm font-medium mb-2">Difficulty Level *</label>
                  <Select
                    value={storyData.difficulty_level}
                    onValueChange={(value) => setStoryData({ ...storyData, difficulty_level: value as DifficultyLevel })}
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
                <div>
                  <label className="block text-sm font-medium mb-2">Estimated Duration (minutes)</label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={storyData.estimated_duration}
                    onChange={(e) => setStoryData({ ...storyData, estimated_duration: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <Textarea
                  placeholder="Describe your story and its cultural significance..."
                  value={storyData.description}
                  onChange={(e) => setStoryData({ ...storyData, description: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cultural Authenticity Score (0-100)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={storyData.cultural_authenticity_score}
                  onChange={(e) => setStoryData({ ...storyData, cultural_authenticity_score: parseInt(e.target.value) || 85 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Rate the cultural authenticity and accuracy of your story
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Passages Tab */}
        <TabsContent value="passages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Passage List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Passages</CardTitle>
                  <Button size="sm" onClick={addPassage}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {passages.map((passage, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          currentPassageIndex === index
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setCurrentPassageIndex(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{passage.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {passage.is_start_passage && (
                                <Badge variant="outline" className="text-xs">Start</Badge>
                              )}
                              {passage.is_end_passage && (
                                <Badge variant="outline" className="text-xs">End</Badge>
                              )}
                            </div>
                          </div>
                          {passages.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePassage(index);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Passage Editor */}
            <div className="lg:col-span-2">
              {currentPassage && (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Passage {currentPassageIndex + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title *</label>
                      <Input
                        value={currentPassage.title}
                        onChange={(e) => updatePassage(currentPassageIndex, { title: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Content *</label>
                      <Textarea
                        value={currentPassage.content}
                        onChange={(e) => updatePassage(currentPassageIndex, { content: e.target.value })}
                        rows={8}
                        placeholder="Write the passage content..."
                      />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={currentPassage.is_start_passage}
                          onChange={(e) => {
                            // Only one start passage allowed
                            if (e.target.checked) {
                              const updatedPassages = passages.map((p, i) => ({
                                ...p,
                                is_start_passage: i === currentPassageIndex
                              }));
                              setPassages(updatedPassages);
                            }
                          }}
                        />
                        <span className="text-sm">Start Passage</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={currentPassage.is_end_passage}
                          onChange={(e) => updatePassage(currentPassageIndex, { is_end_passage: e.target.checked })}
                        />
                        <span className="text-sm">End Passage</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Choices Tab */}
        <TabsContent value="choices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Story Choices</CardTitle>
                <Button onClick={addChoice}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Choice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {choices.map((choice, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Choice {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteChoice(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">From Passage</label>
                          <Select
                            value={choice.from_passage_index.toString()}
                            onValueChange={(value) => updateChoice(index, { from_passage_index: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {passages.map((passage, pIndex) => (
                                <SelectItem key={pIndex} value={pIndex.toString()}>
                                  {passage.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">To Passage</label>
                          <Select
                            value={choice.to_passage_index.toString()}
                            onValueChange={(value) => updateChoice(index, { to_passage_index: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {passages.map((passage, pIndex) => (
                                <SelectItem key={pIndex} value={pIndex.toString()}>
                                  {passage.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Choice Text *</label>
                        <Input
                          value={choice.choice_text}
                          onChange={(e) => updateChoice(index, { choice_text: e.target.value })}
                          placeholder="What choice does the reader make?"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Cultural Impact</label>
                        <Input
                          value={choice.cultural_impact || ''}
                          onChange={(e) => updateChoice(index, { cultural_impact: e.target.value })}
                          placeholder="How does this choice reflect Polynesian values?"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
                
                {choices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ArrowRight className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No choices created yet</p>
                    <p className="text-sm">Add choices to create branching narratives</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Annotations Tab */}
        <TabsContent value="annotations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cultural Annotations</CardTitle>
                <Button onClick={addAnnotation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Annotation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {annotations.map((annotation, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Annotation {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAnnotation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Passage</label>
                          <Select
                            value={annotation.passage_index.toString()}
                            onValueChange={(value) => updateAnnotation(index, { passage_index: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {passages.map((passage, pIndex) => (
                                <SelectItem key={pIndex} value={pIndex.toString()}>
                                  {passage.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Type</label>
                          <Select
                            value={annotation.annotation_type}
                            onValueChange={(value) => updateAnnotation(index, { annotation_type: value as AnnotationType })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {annotationTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Title *</label>
                        <Input
                          value={annotation.title}
                          onChange={(e) => updateAnnotation(index, { title: e.target.value })}
                          placeholder="Annotation title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Content *</label>
                        <Textarea
                          value={annotation.content}
                          onChange={(e) => updateAnnotation(index, { content: e.target.value })}
                          placeholder="Explain the cultural context, significance, or background..."
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">External Links</label>
                        <Textarea
                          value={annotation.external_links.join('\n')}
                          onChange={(e) => updateAnnotation(index, { 
                            external_links: e.target.value.split('\n').filter(link => link.trim()) 
                          })}
                          placeholder="Add external links (one per line)"
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
                
                {annotations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No annotations created yet</p>
                    <p className="text-sm">Add cultural context to educate readers</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}