'use client';

import React, { useState, useEffect } from 'react';
import { Lesson, UserProgress, LessonSection } from '@/types';
import LessonHeader from './LessonHeader';
import TabNavigation from './TabNavigation';
import VocabularyTab from './VocabularyTab';
import ProgressDrawer from './ProgressDrawer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Target, Users, Award, RotateCcw } from 'lucide-react';

interface LessonPageProps {
  lesson: Lesson;
  userProgress?: UserProgress;
  onProgressUpdate?: (progress: UserProgress) => void;
}

const LessonPage: React.FC<LessonPageProps> = ({
  lesson,
  userProgress,
  onProgressUpdate
}) => {
  const [activeTab, setActiveTab] = useState('objectives');
  const [showProgress, setShowProgress] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'french' | 'tahitian'>('french');

  // Calculate overall progress
  const calculateProgress = () => {
    if (!userProgress) return 0;
    const totalSections = lesson.sections.length;
    const completedSections = lesson.sections.filter(section => 
      userProgress.sectionProgress[section.id]?.completed
    ).length;
    return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
  };

  const renderTabContent = () => {
    const section = lesson.sections.find(s => s.id === activeTab);
    
    switch (activeTab) {
      case 'vocabulary':
        const vocabularySection = lesson.sections.find(s => s.kind === 'Vocabulary');
        return (
          <VocabularyTab
            vocabulary={vocabularySection?.vocab || []}
            currentLanguage={currentLanguage as "fr" | "tah" | "en"}
            showTranslations={true}
            showPhonetics={true}
            onToggleTranslations={() => {}}
            onTogglePhonetics={() => {}}
            onPlayAudio={(audioId: number) => {}}
          />
        );
        
      case 'objectives':
        return (
          <Card>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Learning Objectives</h3>
                </div>
                
                <ul className="space-y-2" role="list" aria-label="Learning objectives for this lesson">
                  {lesson.sections.filter(s => s.kind === 'Objectives').map((section, sectionIndex) => 
                    section.contentMd ? (
                      <li key={sectionIndex} className="flex items-start gap-2" role="listitem">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5" aria-hidden="true">
                          {sectionIndex + 1}
                        </span>
                        <span className="text-gray-700">{section.contentMd}</span>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'practice':
        return (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Practice Exercises</h3>
                <p className="text-gray-600 mb-4">Interactive exercises will be available here</p>
                <Button variant="primary" ariaLabel="Start practice exercises">
                  Start Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'culture':
        return (
          <Card>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-purple-600" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Cultural Context</h3>
                </div>
                
                {section?.contentMd ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{section.contentMd}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                    <p className="text-gray-600">Cultural insights will be available here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
        
      case 'review':
        return (
          <Card>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-green-600" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Lesson Review</h3>
                </div>
                
                {section?.content ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Key Takeaways</h4>
                      <ul className="text-green-800 space-y-1" role="list" aria-label="Key takeaways from this lesson">
                        <li role="listitem">• Master basic greetings in Tahitian</li>
                        <li role="listitem">• Understand cultural context of greetings</li>
                        <li role="listitem">• Practice pronunciation with native audio</li>
                      </ul>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="default" className="flex-1" aria-label="Review vocabulary from this lesson">
                        <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                        Review Vocabulary
                      </Button>
                      <Button variant="outline" className="flex-1" aria-label="Continue to next lesson">
                        Next Lesson
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
        
      default:
        return (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">Content for {activeTab} will be available here</p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Lesson Header */}
      <LessonHeader
        lesson={lesson}
        currentLanguage={currentLanguage as "fr" | "tah" | "en"}
        onLanguageToggle={() => setCurrentLanguage(prev => prev === 'french' ? 'tahitian' : 'french')}
        onShowProgress={() => setShowProgress(true)}
        progress={calculateProgress()}
      />
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              { id: 'objectives', label: 'Objectives', icon: Target },
              { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen, count: lesson.sections.find(s => s.kind === 'Vocabulary')?.vocab?.length || 0 },
              { id: 'practice', label: 'Practice', icon: BookOpen },
              { id: 'culture', label: 'Culture', icon: Users },
              { id: 'review', label: 'Review', icon: Award }
            ]}
          />
        </div>
        
        {/* Tab Content */}
        <div className="mb-6">
          {renderTabContent()}
        </div>
      </div>
      
      {/* Progress Drawer */}
      {showProgress && (
        <ProgressDrawer
          lesson={lesson}
          userProgress={userProgress}
          onClose={() => setShowProgress(false)}
        />
      )}
    </div>
  );
};

export { LessonPage };
export default LessonPage;