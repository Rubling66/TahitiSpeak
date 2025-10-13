'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Globe, 
  Volume2, 
  BookOpen, 
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import TahitianAIService from '@/services/ai/TahitianAIService';

interface AITooltipData {
  word: string;
  position: { x: number; y: number };
  culturalContext?: any;
  pronunciation?: any;
  grammarSuggestion?: any;
}

interface AITooltipsProps {
  content: string;
  onWordSelect?: (word: string, position: { x: number; y: number }) => void;
}

export const AITooltips: React.FC<AITooltipsProps> = ({ content, onWordSelect }) => {
  const [activeTooltip, setActiveTooltip] = useState<AITooltipData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tahitianWords, setTahitianWords] = useState<string[]>([]);

  // Extract Tahitian words from content
  useEffect(() => {
    const extractTahitianWords = (text: string) => {
      // Simple regex to identify potential Tahitian words
      // This could be enhanced with a proper Tahitian dictionary
      const tahitianPattern = /\b[aeiouāēīōūhkmnprtv]+\b/gi;
      const matches = text.match(tahitianPattern) || [];
      const uniqueWords = [...new Set(matches.filter(word => word.length > 2))];
      setTahitianWords(uniqueWords);
    };

    extractTahitianWords(content);
  }, [content]);

  const handleWordClick = useCallback(async (word: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top
    };

    setActiveTooltip({ word, position });
    setIsLoading(true);

    try {
      // Get cultural context and pronunciation in parallel
      const [culturalContext, pronunciation] = await Promise.all([
        TahitianAIService.getCulturalContext(word),
        TahitianAIService.generatePronunciationGuide(word)
      ]);

      setActiveTooltip(prev => prev ? {
        ...prev,
        culturalContext,
        pronunciation
      } : null);
    } catch (error) {
      console.error('Error loading tooltip data:', error);
    } finally {
      setIsLoading(false);
    }

    onWordSelect?.(word, position);
  }, [onWordSelect]);

  const closeTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  const renderEnhancedContent = useCallback(() => {
    if (!content) return null;

    let enhancedContent = content;
    
    // Wrap Tahitian words with clickable spans
    tahitianWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      enhancedContent = enhancedContent.replace(regex, (match) => 
        `<span class="tahitian-word cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200 rounded px-1" data-word="${match}">${match}</span>`
      );
    });

    return (
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: enhancedContent }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('tahitian-word')) {
            const word = target.getAttribute('data-word');
            if (word) {
              handleWordClick(word, e as any);
            }
          }
        }}
      />
    );
  }, [content, tahitianWords, handleWordClick]);

  return (
    <TooltipProvider>
      <div className="relative">
        {renderEnhancedContent()}
        
        {activeTooltip && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: activeTooltip.position.x,
              top: activeTooltip.position.y - 10,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <Card className="w-80 shadow-lg border-2 pointer-events-auto">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    {activeTooltip.word}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeTooltip}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pronunciation */}
                    {activeTooltip.pronunciation && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-sm">Pronunciation</span>
                        </div>
                        <div className="pl-6 space-y-1">
                          <div className="text-sm">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {activeTooltip.pronunciation.ipa}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activeTooltip.pronunciation.simplified}
                          </div>
                          {activeTooltip.pronunciation.culturalNotes && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                              {activeTooltip.pronunciation.culturalNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cultural Context */}
                    {activeTooltip.culturalContext && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-sm">Cultural Context</span>
                        </div>
                        <div className="pl-6 space-y-2">
                          <div className="text-sm">
                            <strong>Meaning:</strong> {activeTooltip.culturalContext.meaning}
                          </div>
                          {activeTooltip.culturalContext.culturalSignificance && (
                            <div className="text-sm">
                              <strong>Significance:</strong> {activeTooltip.culturalContext.culturalSignificance}
                            </div>
                          )}
                          {activeTooltip.culturalContext.usage && (
                            <div className="text-sm">
                              <strong>Usage:</strong> {activeTooltip.culturalContext.usage}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Examples */}
                    {activeTooltip.culturalContext?.examples?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-orange-500" />
                          <span className="font-medium text-sm">Examples</span>
                        </div>
                        <div className="pl-6">
                          <ul className="space-y-1">
                            {activeTooltip.culturalContext.examples.slice(0, 2).map((example: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                • {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Respectful Usage */}
                    {activeTooltip.culturalContext?.respectfulUsage?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-sm">Respectful Usage</span>
                        </div>
                        <div className="pl-6">
                          <ul className="space-y-1">
                            {activeTooltip.culturalContext.respectfulUsage.slice(0, 2).map((guideline: string, index: number) => (
                              <li key={index} className="text-xs text-green-700 bg-green-50 p-1 rounded">
                                • {guideline}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Common Mistakes */}
                    {activeTooltip.pronunciation?.commonMistakes?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-sm">Common Mistakes</span>
                        </div>
                        <div className="pl-6">
                          <ul className="space-y-1">
                            {activeTooltip.pronunciation.commonMistakes.slice(0, 2).map((mistake: string, index: number) => (
                              <li key={index} className="text-xs text-yellow-700 bg-yellow-50 p-1 rounded">
                                • {mistake}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Volume2 className="h-3 w-3 mr-1" />
                            Listen
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Play pronunciation audio</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <BookOpen className="h-3 w-3 mr-1" />
                            More
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View detailed information</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AITooltips;