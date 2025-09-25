'use client';

import React from 'react';
import { X, Clock, Trophy, CheckCircle, Target, Circle } from 'lucide-react';
import { UserProgress, SectionKind } from '@/types';

interface ProgressSection {
  kind: SectionKind;
  title: string;
  completed: boolean;
  score?: number;
  timeSpent?: number;
}

interface ProgressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  sections: ProgressSection[];
  currentSection: SectionKind;
  onSectionClick: (section: SectionKind) => void;
}

const ProgressDrawer: React.FC<ProgressDrawerProps> = ({
  isOpen,
  onClose,
  progress,
  sections,
  currentSection,
  onSectionClick
}) => {
  const completedSections = sections.filter(s => s.completed).length;
  const totalSections = sections.length;
  const progressPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSectionIcon = (kind: SectionKind): React.ReactNode => {
    switch (kind) {
      case 'Objectives':
        return <Target className="w-4 h-4" />;
      case 'Vocabulary':
        return <Circle className="w-4 h-4" />;
      case 'Practice':
        return <Circle className="w-4 h-4" />;
      case 'Culture':
        return <Circle className="w-4 h-4" />;
      case 'Review':
        return <Circle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 id="progress-heading" className="text-lg font-semibold text-gray-900">Progression</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Fermer le panneau de progression"
            >
              <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Overall Progress */}
            <section aria-labelledby="overall-progress-heading">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span id="overall-progress-heading" className="text-sm font-medium text-gray-700">Progression générale</span>
                  <span className="text-sm text-gray-500" aria-label={`${completedSections} sections complétées sur ${totalSections}`}>
                    {completedSections}/{totalSections}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                    aria-label={`Progression générale: ${Math.round(progressPercentage)}%`}
                  />
                </div>
                
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-900" aria-label={`${Math.round(progressPercentage)} pour cent complété`}>
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
              </div>
            </section>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-blue-900">
                  {progress.attempts || 0} attempts
                </div>
                <div className="text-xs text-blue-600">Tentatives</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-sm font-medium text-green-900">
                  {progress.score || 0}%
                </div>
                <div className="text-xs text-green-600">Score global</div>
              </div>
            </div>

            {/* Section Progress */}
            <section aria-labelledby="section-progress-heading">
              <div className="space-y-3">
                <h3 id="section-progress-heading" className="text-sm font-medium text-gray-700">Sections</h3>
                
                <div className="space-y-2" role="list" aria-label="Progression des sections de la leçon">
                  {sections.map((section, index) => (
                    <button
                      key={section.kind}
                      onClick={() => onSectionClick(section.kind)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        currentSection === section.kind
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      role="listitem"
                      aria-label={`Section ${section.title}, ${section.completed ? 'complétée' : 'en cours'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex-shrink-0 ${
                          section.completed ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {section.completed ? (
                            <CheckCircle className="w-5 h-5" aria-label="Complétée" />
                          ) : (
                            <span aria-label="En cours">{getSectionIcon(section.kind)}</span>
                          )}
                        </div>
                        
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {section.title}
                          </div>
                          
                          {section.completed && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              {section.score !== undefined && (
                                <span className={getScoreColor(section.score)}>
                                  {section.score}%
                                </span>
                              )}
                              {section.timeSpent !== undefined && (
                                <span>{formatTime(section.timeSpent)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {currentSection === section.kind && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Section Info */}
            <section aria-labelledby="section-info-heading">
              <div className="space-y-3">
                <h3 id="section-info-heading" className="text-sm font-medium text-gray-700">Section actuelle</h3>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {progress.sectionKind}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {progress.completed ? 'Complétée' : 'En cours'}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center" role="status" aria-live="polite">
              Dernière mise à jour :
              <br />
              {new Date(progress.updatedAt).toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProgressDrawer;
export type { ProgressSection };