// This file is deprecated - use LocalAIService instead
// Keeping for backward compatibility during migration
import LocalAIService from '../local-ai/LocalAIService';

export interface TranslationRequest {
  text: string;
  fromLanguage: 'fr' | 'ty' | 'en';
  toLanguage: 'fr' | 'ty' | 'en';
}

export interface PronunciationFeedback {
  accuracy: number;
  feedback: string;
  suggestions: string[];
  phonetics: string;
}

export interface LessonContent {
  title: string;
  description: string;
  vocabulary: Array<{
    tahitian: string;
    french: string;
    english: string;
    pronunciation: string;
    audioUrl?: string;
  }>;
  exercises: Array<{
    type: 'translation' | 'pronunciation' | 'listening';
    question: string;
    options?: string[];
    correctAnswer: string;
  }>;
}

export class AIService {
  private static instance: AIService;
  private localAI: LocalAIService;

  private constructor() {
    this.localAI = LocalAIService.getInstance();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Translate text between French, Tahitian, and English
   */
  async translateText(request: TranslationRequest): Promise<string> {
    return this.localAI.translateText(request);
  }

  /**
   * Analyze pronunciation and provide feedback
   */
  async analyzePronunciation(
    targetText: string,
    userAudio: string,
    language: 'fr' | 'ty'
  ): Promise<PronunciationFeedback> {
    return this.localAI.analyzePronunciation(targetText, userAudio, language);
  }

  /**
   * Generate personalized lesson content
   */
  async generateLesson(
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced',
    focusAreas: string[]
  ): Promise<LessonContent> {
    return this.localAI.generateLesson(topic, level, focusAreas);
  }

  /**
   * Get conversation practice suggestions
   */
  async getConversationSuggestions(
    context: string,
    userLevel: string
  ): Promise<string[]> {
    return this.localAI.getConversationSuggestions(context, userLevel);
  }

  /**
   * Test connection to local AI model
   */
  async testConnection(): Promise<boolean> {
    return this.localAI.testConnection();
  }

  /**
   * Analyze learning progress and provide recommendations
   */
  async analyzeProgress(
    userStats: {
      lessonsCompleted: number;
      averageScore: number;
      weakAreas: string[];
      strongAreas: string[];
    }
  ): Promise<{
    recommendations: string[];
    nextSteps: string[];
    motivationalMessage: string;
  }> {
    const request = {
      userStats,
      analysisType: 'progress' as const
    };
    
    try {
      const result = await this.localAI.analyzeProgress(request);
      return result;
    } catch (error) {
      console.error('Progress analysis error:', error);
      return {
        recommendations: ['Continue practicing daily', 'Focus on pronunciation'],
        nextSteps: ['Complete more lessons', 'Practice with native speakers'],
        motivationalMessage: 'You\'re making great progress! Keep up the excellent work!'
      };
    }
  }
}

export default AIService.getInstance();