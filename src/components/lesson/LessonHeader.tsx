'use client';

import React from 'react';
import { ArrowLeft, Clock, Tag, Volume2 } from 'lucide-react';
import { Lesson, TitleTriplet } from '@/types';

interface LessonHeaderProps {
  lesson: Lesson;
  currentLanguage: 'fr' | 'tah' | 'en';
  onLanguageChange: (language: 'fr' | 'tah' | 'en') => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const LessonHeader: React.FC<LessonHeaderProps> = ({
  lesson,
  currentLanguage,
  onLanguageChange,
  onBack,
  showBackButton = true
}) => {
  const getTitle = (title: TitleTriplet): string => {
    return title[currentLanguage] || title.fr || title.en;
  };

  const getLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLanguageLabel = (lang: 'fr' | 'tah' | 'en'): string => {
    switch (lang) {
      case 'fr': return 'Français';
      case 'tah': return 'Tahitien';
      case 'en': return 'English';
      default: return lang;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6 relative overflow-hidden">
      {/* Subtle Polynesian Pattern Background */}
      <div className="absolute inset-0 opacity-3">
        <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="xMidYMid slice">
          {/* Minimalist wave pattern for lesson header */}
          <path d="M0,60 Q150,30 300,60 T600,60" stroke="#1e40af" strokeWidth="1" fill="none" />
          <path d="M0,70 Q150,40 300,70 T600,70" stroke="#1e40af" strokeWidth="0.5" fill="none" />
          
          {/* Sparse geometric elements */}
          <g transform="translate(100,40)">
            <polygon points="0,0 6,3 12,0 9,9 3,9" fill="#1e40af" opacity="0.15" />
          </g>
          
          <g transform="translate(250,50)">
            <polygon points="0,0 8,4 16,0 12,12 4,12" fill="#1e40af" opacity="0.15" />
          </g>
          
          <g transform="translate(400,35)">
            <polygon points="0,0 6,3 12,0 9,9 3,9" fill="#1e40af" opacity="0.15" />
          </g>
          
          <g transform="translate(500,45)">
            <rect x="0" y="0" width="2" height="12" fill="#1e40af" opacity="0.1" />
            <rect x="4" y="0" width="2" height="12" fill="#1e40af" opacity="0.1" />
            <rect x="8" y="0" width="2" height="12" fill="#1e40af" opacity="0.1" />
          </g>
        </svg>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation and Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Retour aux leçons"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            {/* Language Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['fr', 'tah', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    currentLanguage === lang
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label={`Changer vers ${getLanguageLabel(lang)}`}
                >
                  {getLanguageLabel(lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Control */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Lire le titre de la leçon"
          >
            <Volume2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Lesson Info */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getTitle(lesson.title)}
            </h1>
            
            {/* Subtitle in other languages */}
            <div className="space-y-1">
              {currentLanguage !== 'fr' && (
                <p className="text-lg text-gray-600">
                  <span className="text-sm text-gray-500 mr-2">FR:</span>
                  {lesson.title.fr}
                </p>
              )}
              {currentLanguage !== 'tah' && (
                <p className="text-lg text-gray-600">
                  <span className="text-sm text-gray-500 mr-2">TAH:</span>
                  {lesson.title.tah}
                </p>
              )}
              {currentLanguage !== 'en' && (
                <p className="text-lg text-gray-600">
                  <span className="text-sm text-gray-500 mr-2">EN:</span>
                  {lesson.title.en}
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl">
            {lesson.summary}
          </p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 pt-2" role="list" aria-label="Lesson details">
            {/* Level Badge */}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getLevelColor(lesson.level)}`} role="listitem" aria-label={`Difficulty level: ${lesson.level}`}>
              {lesson.level}
            </span>

            {/* Duration */}
            <div className="flex items-center text-gray-600" role="listitem">
              <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
              <span className="text-sm">{lesson.durationMin} min</span>
            </div>

            {/* Tags */}
            {lesson.tags && lesson.tags.length > 0 && (
              <div className="flex items-center space-x-2" role="listitem">
                <Tag className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <div className="flex flex-wrap gap-1" role="list" aria-label="Lesson topics">
                  {lesson.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                      role="listitem"
                      aria-label={`Topic: ${tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                  {lesson.tags.length > 3 && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded" role="listitem">
                      +{lesson.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default LessonHeader;