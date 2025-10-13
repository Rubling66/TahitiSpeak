// components/admin/lesson-plans/LessonPlanBuilder.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  LessonPlan, 
  LessonPlanTemplate, 
  LessonActivity, 
  LessonObjective, 
  LessonAssessment,
  defaultLessonPlanTemplates 
} from '@/types/lesson-plan';
import { 
  Save, 
  Plus, 
  Trash2, 
  Clock, 
  Users, 
  Target, 
  BookOpen, 
  FileText, 
  Settings,
  Eye,
  Share,
  Download,
  Copy
} from 'lucide-react';

interface LessonPlanBuilderProps {
  initialLessonPlan?: Partial<LessonPlan>;
  onSave?: (lessonPlan: LessonPlan) => void;
  onPreview?: (lessonPlan: LessonPlan) => void;
}

export function LessonPlanBuilder({ 
  initialLessonPlan, 
  onSave, 
  onPreview 
}: LessonPlanBuilderProps) {
  const [lessonPlan, setLessonPlan] = useState<Partial<LessonPlan>>({
    metadata: {
      id: '',
      title: '',
      description: '',
      subject: 'Tahitian Language',
      level: 'beginner',
      duration: 50,
      targetAudience: '',
      prerequisites: [],
      keywords: [],
      language: 'Tahitian'
    },
    objectives: [],
    activities: [],
    assessments: [],
    materials: {
      required: [],
      optional: [],
      digital: []
    },
    differentiation: {
      forAdvanced: [],
      forStruggling: [],
      forELL: []
    },
    reflection: {
      whatWorked: '',
      whatToImprove: '',
      studentFeedback: '',
      nextSteps: ''
    },
    status: 'draft',
    collaborators: [],
    ...initialLessonPlan
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('metadata');

  const handleTemplateSelect = (templateId: string) => {
    const template = defaultLessonPlanTemplates.find(t => t.id === templateId);
    if (template) {
      setLessonPlan(prev => ({
        ...prev,
        templateId: template.id,
        activities: template.defaultActivities.map((activity, index) => ({
          id: `activity-${index + 1}`,
          title: activity.title || '',
          description: activity.description || '',
          type: activity.type || 'presentation',
          duration: activity.duration || 10,
          materials: activity.materials || [],
          instructions: activity.instructions || [],
          grouping: activity.grouping || 'whole-class',
          skillsFocus: activity.skillsFocus || ['listening']
        })) as LessonActivity[]
      }));
      setSelectedTemplate(templateId);
    }
  };

  const addObjective = () => {
    const newObjective: LessonObjective = {
      id: `obj-${Date.now()}`,
      description: '',
      type: 'knowledge',
      bloomsLevel: 'remember'
    };
    setLessonPlan(prev => ({
      ...prev,
      objectives: [...(prev.objectives || []), newObjective]
    }));
  };

  const updateObjective = (index: number, field: keyof LessonObjective, value: any) => {
    setLessonPlan(prev => ({
      ...prev,
      objectives: prev.objectives?.map((obj, i) => 
        i === index ? { ...obj, [field]: value } : obj
      ) || []
    }));
  };

  const removeObjective = (index: number) => {
    setLessonPlan(prev => ({
      ...prev,
      objectives: prev.objectives?.filter((_, i) => i !== index) || []
    }));
  };

  const addActivity = () => {
    const newActivity: LessonActivity = {
      id: `activity-${Date.now()}`,
      title: '',
      description: '',
      type: 'presentation',
      duration: 10,
      materials: [],
      instructions: [],
      grouping: 'whole-class',
      skillsFocus: ['listening']
    };
    setLessonPlan(prev => ({
      ...prev,
      activities: [...(prev.activities || []), newActivity]
    }));
  };

  const updateActivity = (index: number, field: keyof LessonActivity, value: any) => {
    setLessonPlan(prev => ({
      ...prev,
      activities: prev.activities?.map((activity, i) => 
        i === index ? { ...activity, [field]: value } : activity
      ) || []
    }));
  };

  const removeActivity = (index: number) => {
    setLessonPlan(prev => ({
      ...prev,
      activities: prev.activities?.filter((_, i) => i !== index) || []
    }));
  };

  const addAssessment = () => {
    const newAssessment: LessonAssessment = {
      id: `assessment-${Date.now()}`,
      type: 'formative',
      method: 'observation',
      criteria: []
    };
    setLessonPlan(prev => ({
      ...prev,
      assessments: [...(prev.assessments || []), newAssessment]
    }));
  };

  const updateAssessment = (index: number, field: keyof LessonAssessment, value: any) => {
    setLessonPlan(prev => ({
      ...prev,
      assessments: prev.assessments?.map((assessment, i) => 
        i === index ? { ...assessment, [field]: value } : assessment
      ) || []
    }));
  };

  const removeAssessment = (index: number) => {
    setLessonPlan(prev => ({
      ...prev,
      assessments: prev.assessments?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSave = () => {
    const completeLessonPlan: LessonPlan = {
      id: lessonPlan.id || `lesson-${Date.now()}`,
      metadata: lessonPlan.metadata!,
      templateId: lessonPlan.templateId,
      objectives: lessonPlan.objectives || [],
      activities: lessonPlan.activities || [],
      assessments: lessonPlan.assessments || [],
      materials: lessonPlan.materials!,
      homework: lessonPlan.homework,
      differentiation: lessonPlan.differentiation!,
      reflection: lessonPlan.reflection!,
      version: lessonPlan.version || 1,
      status: lessonPlan.status || 'draft',
      collaborators: lessonPlan.collaborators || [],
      createdBy: lessonPlan.createdBy || 'current-user',
      createdAt: lessonPlan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: lessonPlan.usageCount || 0
    };
    onSave?.(completeLessonPlan);
  };

  const handlePreview = () => {
    const completeLessonPlan: LessonPlan = {
      id: lessonPlan.id || `lesson-${Date.now()}`,
      metadata: lessonPlan.metadata!,
      templateId: lessonPlan.templateId,
      objectives: lessonPlan.objectives || [],
      activities: lessonPlan.activities || [],
      assessments: lessonPlan.assessments || [],
      materials: lessonPlan.materials!,
      homework: lessonPlan.homework,
      differentiation: lessonPlan.differentiation!,
      reflection: lessonPlan.reflection!,
      version: lessonPlan.version || 1,
      status: lessonPlan.status || 'draft',
      collaborators: lessonPlan.collaborators || [],
      createdBy: lessonPlan.createdBy || 'current-user',
      createdAt: lessonPlan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: lessonPlan.usageCount || 0
    };
    onPreview?.(completeLessonPlan);
  };

  const totalDuration = lessonPlan.activities?.reduce((sum, activity) => sum + activity.duration, 0) || 0;

  const sections = [
    { id: 'metadata', label: 'Basic Info', icon: FileText },
    { id: 'template', label: 'Template', icon: BookOpen },
    { id: 'objectives', label: 'Objectives', icon: Target },
    { id: 'activities', label: 'Activities', icon: Users },
    { id: 'assessments', label: 'Assessment', icon: Settings },
    { id: 'materials', label: 'Materials', icon: BookOpen },
    { id: 'differentiation', label: 'Differentiation', icon: Users },
    { id: 'reflection', label: 'Reflection', icon: FileText }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson Plan Builder</h1>
            <p className="text-gray-600">
              Create comprehensive lesson plans for Tahitian language learning
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              Total Duration: <span className="font-medium text-gray-900">{totalDuration} minutes</span>
            </div>
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <Icon size={16} />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Metadata Section */}
        {activeSection === 'metadata' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={lessonPlan.metadata?.title || ''}
                  onChange={(e) => setLessonPlan(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata!, title: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter lesson title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  value={lessonPlan.metadata?.level || 'beginner'}
                  onChange={(e) => setLessonPlan(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata!, level: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={lessonPlan.metadata?.duration || 50}
                  onChange={(e) => setLessonPlan(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata!, duration: parseInt(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={lessonPlan.metadata?.targetAudience || ''}
                  onChange={(e) => setLessonPlan(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata!, targetAudience: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Adult beginners, High school students"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={lessonPlan.metadata?.description || ''}
                onChange={(e) => setLessonPlan(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata!, description: e.target.value }
                }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the lesson"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cultural Context
              </label>
              <textarea
                value={lessonPlan.metadata?.culturalContext || ''}
                onChange={(e) => setLessonPlan(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata!, culturalContext: e.target.value }
                }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cultural context and background information"
              />
            </div>
          </div>
        )}

        {/* Template Section */}
        {activeSection === 'template' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Template</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defaultLessonPlanTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`
                    p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedTemplate === template.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="text-xs text-gray-500">
                    <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                      {template.category}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    {template.structure.phases.length} phases • 
                    {template.structure.phases.reduce((sum, phase) => sum + phase.suggestedDuration, 0)} min
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Objectives Section */}
        {activeSection === 'objectives' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Learning Objectives</h2>
              <button
                onClick={addObjective}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Add Objective
              </button>
            </div>

            <div className="space-y-4">
              {lessonPlan.objectives?.map((objective, index) => (
                <div key={objective.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">Objective {index + 1}</h3>
                    <button
                      onClick={() => removeObjective(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={objective.type}
                        onChange={(e) => updateObjective(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="knowledge">Knowledge</option>
                        <option value="skill">Skill</option>
                        <option value="attitude">Attitude</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bloom's Level
                      </label>
                      <select
                        value={objective.bloomsLevel}
                        onChange={(e) => updateObjective(index, 'bloomsLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="remember">Remember</option>
                        <option value="understand">Understand</option>
                        <option value="apply">Apply</option>
                        <option value="analyze">Analyze</option>
                        <option value="evaluate">Evaluate</option>
                        <option value="create">Create</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={objective.description}
                      onChange={(e) => updateObjective(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Students will be able to..."
                    />
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <Target size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No objectives added yet. Click "Add Objective" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activities Section */}
        {activeSection === 'activities' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Lesson Activities</h2>
              <button
                onClick={addActivity}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Add Activity
              </button>
            </div>

            <div className="space-y-4">
              {lessonPlan.activities?.map((activity, index) => (
                <div key={activity.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">Activity {index + 1}</h3>
                    <button
                      onClick={() => removeActivity(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={activity.title}
                        onChange={(e) => updateActivity(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Activity title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={activity.type}
                        onChange={(e) => updateActivity(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="warmup">Warm-up</option>
                        <option value="presentation">Presentation</option>
                        <option value="practice">Practice</option>
                        <option value="production">Production</option>
                        <option value="assessment">Assessment</option>
                        <option value="wrap-up">Wrap-up</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={activity.duration}
                        onChange={(e) => updateActivity(index, 'duration', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grouping
                      </label>
                      <select
                        value={activity.grouping}
                        onChange={(e) => updateActivity(index, 'grouping', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="individual">Individual</option>
                        <option value="pairs">Pairs</option>
                        <option value="small-group">Small Group</option>
                        <option value="whole-class">Whole Class</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={activity.description}
                      onChange={(e) => updateActivity(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the activity"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Materials (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={activity.materials.join(', ')}
                        onChange={(e) => updateActivity(index, 'materials', e.target.value.split(', ').filter(Boolean))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Whiteboard, handouts, audio files"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={activity.instructions.join(', ')}
                        onChange={(e) => updateActivity(index, 'instructions', e.target.value.split(', ').filter(Boolean))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Step 1, Step 2, Step 3"
                      />
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No activities added yet. Click "Add Activity" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other sections would continue here... */}
        {activeSection === 'assessments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Assessment Methods</h2>
              <button
                onClick={addAssessment}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Add Assessment
              </button>
            </div>

            <div className="space-y-4">
              {lessonPlan.assessments?.map((assessment, index) => (
                <div key={assessment.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">Assessment {index + 1}</h3>
                    <button
                      onClick={() => removeAssessment(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={assessment.type}
                        onChange={(e) => updateAssessment(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="formative">Formative</option>
                        <option value="summative">Summative</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Method
                      </label>
                      <select
                        value={assessment.method}
                        onChange={(e) => updateAssessment(index, 'method', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="observation">Observation</option>
                        <option value="quiz">Quiz</option>
                        <option value="presentation">Presentation</option>
                        <option value="project">Project</option>
                        <option value="discussion">Discussion</option>
                        <option value="self-assessment">Self-assessment</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Criteria (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={assessment.criteria.join(', ')}
                      onChange={(e) => updateAssessment(index, 'criteria', e.target.value.split(', ').filter(Boolean))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Pronunciation, accuracy, fluency"
                    />
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <Settings size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No assessments added yet. Click "Add Assessment" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder for other sections */}
        {!['metadata', 'template', 'objectives', 'activities', 'assessments'].includes(activeSection) && (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Section Under Development</h3>
            <p>This section is being developed. Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}