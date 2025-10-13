import { ai } from './config';
import { gemini15Flash } from '@genkit-ai/googleai';

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

  private constructor() {}

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
    try {
      const prompt = `Translate the following text from ${request.fromLanguage} to ${request.toLanguage}:

"${request.text}"

Provide only the translation, no additional text.`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 200,
        },
      });

      return result.text;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Failed to translate text');
    }
  }

  /**
   * Analyze pronunciation and provide feedback
   */
  async analyzePronunciation(
    targetText: string,
    userAudio: string,
    language: 'fr' | 'ty'
  ): Promise<PronunciationFeedback> {
    try {
      const prompt = `Analyze the pronunciation of "${targetText}" in ${language === 'fr' ? 'French' : 'Tahitian'}.

Provide feedback in the following JSON format:
{
  "accuracy": <number between 0-100>,
  "feedback": "<constructive feedback>",
  "suggestions": ["<suggestion1>", "<suggestion2>"],
  "phonetics": "<IPA phonetic transcription>"
}

Focus on common pronunciation challenges for language learners.`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.4,
          maxOutputTokens: 300,
        },
      });

      return JSON.parse(result.text);
    } catch (error) {
      console.error('Pronunciation analysis error:', error);
      // Return default feedback on error
      return {
        accuracy: 75,
        feedback: 'Keep practicing! Focus on clear pronunciation.',
        suggestions: ['Practice slowly', 'Listen to native speakers'],
        phonetics: targetText,
      };
    }
  }

  /**
   * Generate personalized lesson content
   */
  async generateLesson(
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced',
    focusAreas: string[]
  ): Promise<LessonContent> {
    try {
      const prompt = `Create a ${level} level Tahitian language lesson about "${topic}".

Focus areas: ${focusAreas.join(', ')}

Provide the lesson in the following JSON format:
{
  "title": "<lesson title>",
  "description": "<lesson description>",
  "vocabulary": [
    {
      "tahitian": "<tahitian word>",
      "french": "<french translation>",
      "english": "<english translation>",
      "pronunciation": "<pronunciation guide>"
    }
  ],
  "exercises": [
    {
      "type": "translation|pronunciation|listening",
      "question": "<exercise question>",
      "options": ["<option1>", "<option2>", "<option3>"],
      "correctAnswer": "<correct answer>"
    }
  ]
}

Include 5-8 vocabulary items and 3-5 exercises.`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      return JSON.parse(result.text);
    } catch (error) {
      console.error('Lesson generation error:', error);
      throw new Error('Failed to generate lesson content');
    }
  }

  /**
   * Get conversation practice suggestions
   */
  async getConversationSuggestions(
    context: string,
    userLevel: string
  ): Promise<string[]> {
    try {
      const prompt = `Generate 5 conversation practice suggestions for a ${userLevel} Tahitian language learner in the context of: ${context}

Provide suggestions as a JSON array of strings, each suggestion should be a complete sentence or phrase in Tahitian with French translation in parentheses.`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.6,
          maxOutputTokens: 400,
        },
      });

      return JSON.parse(result.text);
    } catch (error) {
      console.error('Conversation suggestions error:', error);
      return [
        'Ia ora na (Bonjour)',
        'E aha tō oe i hia nei? (Comment allez-vous?)',
        'Mauruuru (Merci)',
        'Nana (Au revoir)',
        'E aha tō oe i roa? (Comment vous appelez-vous?)'
      ];
    }
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
    try {
      const prompt = `Analyze a Tahitian language learner's progress:

Lessons completed: ${userStats.lessonsCompleted}
Average score: ${userStats.averageScore}%
Weak areas: ${userStats.weakAreas.join(', ')}
Strong areas: ${userStats.strongAreas.join(', ')}

Provide analysis in JSON format:
{
  "recommendations": ["<recommendation1>", "<recommendation2>"],
  "nextSteps": ["<step1>", "<step2>"],
  "motivationalMessage": "<encouraging message>"
}

Focus on actionable advice and positive reinforcement.`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.5,
          maxOutputTokens: 400,
        },
      });

      return JSON.parse(result.text);
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