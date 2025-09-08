'use client';

import React, { useState } from 'react';
import { Volume2, Star, Eye, EyeOff } from 'lucide-react';
import { VocabItem } from '@/types';

interface VocabularyTabProps {
  vocabulary: VocabItem[];
  currentLanguage: 'fr' | 'tah' | 'en';
  showTranslations: boolean;
  showPhonetics: boolean;
  onToggleTranslations: () => void;
  onTogglePhonetics: () => void;
  onPlayAudio?: (audioId: number) => void;
}

const VocabularyTab: React.FC<VocabularyTabProps> = ({
  vocabulary,
  currentLanguage,
  showTranslations,
  showPhonetics,
  onToggleTranslations,
  onTogglePhonetics,
  onPlayAudio
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByCore, setFilterByCore] = useState(false);

  const filteredVocabulary = vocabulary
    .filter(item => {
      const matchesSearch = !searchTerm || 
        item.fr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tah.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.en.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCore = !filterByCore || item.isCore;
      
      return matchesSearch && matchesCore;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const getPartOfSpeechColor = (pos: string): string => {
    switch (pos.toLowerCase()) {
      case 'noun':
      case 'nom':
        return 'bg-blue-100 text-blue-800';
      case 'verb':
      case 'verbe':
        return 'bg-green-100 text-green-800';
      case 'adjective':
      case 'adjectif':
        return 'bg-purple-100 text-purple-800';
      case 'adverb':
      case 'adverbe':
        return 'bg-orange-100 text-orange-800';
      case 'interjection':
        return 'bg-pink-100 text-pink-800';
      case 'expression':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrimaryText = (item: VocabItem): string => {
    switch (currentLanguage) {
      case 'fr': return item.fr;
      case 'tah': return item.tah;
      case 'en': return item.en;
      default: return item.fr;
    }
  };

  const getPhonetics = (item: VocabItem): string | undefined => {
    switch (currentLanguage) {
      case 'fr': return item.ipaFr;
      case 'tah': return item.ipaTah;
      case 'en': return item.ipaEn;
      default: return item.ipaFr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher dans le vocabulaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search vocabulary items"
              role="searchbox"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filterByCore}
                onChange={(e) => setFilterByCore(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={filterByCore ? 'Show all vocabulary words' : 'Show only core vocabulary words'}
                aria-pressed={filterByCore}
              />
              <span className="text-sm text-gray-700">Mots essentiels</span>
            </label>
          </div>
        </div>

        {/* Display Options */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Display options">
          <button
            onClick={onToggleTranslations}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showTranslations
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
            aria-label={showTranslations ? 'Hide translations' : 'Show translations'}
            aria-pressed={showTranslations}
          >
            {showTranslations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Traductions</span>
          </button>
          
          <button
            onClick={onTogglePhonetics}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showPhonetics
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
            aria-label={showPhonetics ? 'Hide phonetic transcriptions' : 'Show phonetic transcriptions'}
            aria-pressed={showPhonetics}
          >
            {showPhonetics ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Phonétique</span>
          </button>
        </div>
      </div>

      {/* Vocabulary List */}
      <div className="space-y-4">
        {filteredVocabulary.length === 0 ? (
          <div className="text-center py-8 text-gray-500" role="status" aria-live="polite">
            <p>Aucun mot trouvé pour votre recherche.</p>
          </div>
        ) : (
          filteredVocabulary.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              role="listitem"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  {/* Primary Term */}
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900" id={`vocab-${index}-primary`}>
                      {getPrimaryText(item)}
                    </h3>
                    
                    {item.isCore && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" title="Mot essentiel" aria-label="Core vocabulary word" />
                    )}
                    
                    {item.partOfSpeech && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPartOfSpeechColor(item.partOfSpeech)}`}>
                        {item.partOfSpeech}
                      </span>
                    )}
                  </div>

                  {/* Phonetics */}
                  {showPhonetics && getPhonetics(item) && (
                    <p className="text-sm text-gray-600 font-mono" id={`vocab-${index}-phonetics`} aria-label={`Pronunciation: ${getPhonetics(item)}`}>
                      {getPhonetics(item)}
                    </p>
                  )}

                  {/* Translations */}
                  {showTranslations && (
                    <div className="space-y-1">
                      {currentLanguage !== 'fr' && (
                        <p className="text-sm text-gray-700" lang="fr">
                          <span className="font-medium text-gray-500 mr-2">FR:</span>
                          {item.fr}
                        </p>
                      )}
                      {currentLanguage !== 'tah' && (
                        <p className="text-sm text-gray-700" lang="ty">
                          <span className="font-medium text-gray-500 mr-2">TAH:</span>
                          {item.tah}
                        </p>
                      )}
                      {currentLanguage !== 'en' && (
                        <p className="text-sm text-gray-700" lang="en">
                          <span className="font-medium text-gray-500 mr-2">EN:</span>
                          {item.en}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Note */}
                  {item.note && (
                    <p className="text-sm text-gray-600 italic">
                      {item.note}
                    </p>
                  )}
                </div>

                {/* Audio Button */}
                {item.audioMediaId && onPlayAudio && (
                  <button
                    onClick={() => onPlayAudio(item.audioMediaId!)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    aria-label={`Listen to pronunciation of ${getPrimaryText(item)}`}
                    aria-describedby={`vocab-${index}-primary`}
                  >
                    <Volume2 className="w-5 h-5" aria-hidden="true" />
                    <span className="sr-only">Play audio</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        {filteredVocabulary.length} mot{filteredVocabulary.length !== 1 ? 's' : ''} affich&eacute;{filteredVocabulary.length !== 1 ? 's' : ''}
        {filterByCore && ` (mots essentiels uniquement)`}
      </div>
    </div>
  );
};

export default VocabularyTab;