import { useState, useCallback } from 'react';
import { TranslationRequest, PronunciationFeedback, LessonContent } from '../lib/local-ai/LocalAIService';
import { LocalAIService } from '../lib/local-ai/LocalAIService';

export interface UseAIReturn {
  // Translation
  translateText: (request: TranslationRequest) => Promise<string>;
  isTranslating: boolean;
  translationError: string | null;
  
  // Pronunciation Analysis
  analyzePronunciation: (targetText: string, userAudio: string, language: 'fr' | 'ty') => Promise<PronunciationFeedback>;
  isAnalyzing: boolean;
  analysisError: string | null;
  
  // Lesson Generation
  generateLesson: (topic: string, level: 'beginner' | 'intermediate' | 'advanced', focusAreas: string[]) => Promise<LessonContent>;
  isGenerating: boolean;
  generationError: string | null;
  
  // Conversation Suggestions
  getConversationSuggestions: (context: string, userLevel: string) => Promise<string[]>;
  isFetchingSuggestions: boolean;
  suggestionsError: string | null;
  
  // Progress Analysis
  analyzeProgress: (userStats: {
    lessonsCompleted: number;
    averageScore: number;
    weakAreas: string[];
    strongAreas: string[];
  }) => Promise<{
    recommendations: string[];
    nextSteps: string[];
    motivationalMessage: string;
  }>;
  isAnalyzingProgress: boolean;
  progressError: string | null;
  
  // General
  clearErrors: () => void;
}

export function useAI(): UseAIReturn {
  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  
  // Pronunciation analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Lesson generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Conversation suggestions state
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  
  // Progress analysis state
  const [isAnalyzingProgress, setIsAnalyzingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  
  const translateText = useCallback(async (request: TranslationRequest): Promise<string> => {
    setIsTranslating(true);
    setTranslationError(null);
    
    try {
      const localAI = LocalAIService.getInstance();
      const result = await localAI.translateText(request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      setTranslationError(errorMessage);
      throw error;
    } finally {
      setIsTranslating(false);
    }
  }, []);
  
  const analyzePronunciation = useCallback(async (targetText: string, userAudio: string, language: 'fr' | 'ty'): Promise<PronunciationFeedback> => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const localAI = LocalAIService.getInstance();
      const result = await localAI.analyzePronunciation(targetText, userAudio, language);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze pronunciation';
      setAnalysisError(errorMessage);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);
  
  const generateLesson = useCallback(async (
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced',
    focusAreas: string[]
  ): Promise<LessonContent> => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const localAI = LocalAIService.getInstance();
      const result = await localAI.generateLessonContent(topic, level, focusAreas);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lesson generation failed';
      setGenerationError(errorMessage);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  const getConversationSuggestions = useCallback(async (
    context: string,
    userLevel: string
  ): Promise<string[]> => {
    setIsFetchingSuggestions(true);
    setSuggestionsError(null);
    
    try {
      const localAI = LocalAIService.getInstance();
      const result = await localAI.getConversationSuggestions(context, userLevel);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get conversation suggestions';
      setSuggestionsError(errorMessage);
      throw error;
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);
  
  const analyzeProgress = useCallback(async (userStats: {
    lessonsCompleted: number;
    averageScore: number;
    weakAreas: string[];
    strongAreas: string[];
  }) => {
    setIsAnalyzingProgress(true);
    setProgressError(null);
    
    try {
      const localAI = LocalAIService.getInstance();
      const result = await localAI.analyzeLearningProgress(userStats);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Progress analysis failed';
      setProgressError(errorMessage);
      throw error;
    } finally {
      setIsAnalyzingProgress(false);
    }
  }, []);
  
  const clearErrors = useCallback(() => {
    setTranslationError(null);
    setAnalysisError(null);
    setGenerationError(null);
    setSuggestionsError(null);
    setProgressError(null);
  }, []);
  
  return {
    translateText,
    isTranslating,
    translationError,
    
    analyzePronunciation,
    isAnalyzing,
    analysisError,
    
    generateLesson,
    isGenerating,
    generationError,
    
    getConversationSuggestions,
    isFetchingSuggestions,
    suggestionsError,
    
    analyzeProgress,
    isAnalyzingProgress,
    progressError,
    
    clearErrors,
  };
}

export default useAI;