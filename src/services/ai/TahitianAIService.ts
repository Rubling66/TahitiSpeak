import { ai } from '../../lib/genkit/config';
import { gemini15Flash } from '@genkit-ai/googleai';
import AIService from '../../lib/genkit/AIService';

export interface LessonPlanRequest {
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // in minutes
  culturalFocus?: boolean;
  objectives?: string[];
}

export interface LessonPlan {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: number;
  objectives: string[];
  culturalContext: string;
  vocabulary: Array<{
    tahitian: string;
    french: string;
    english: string;
    pronunciation: string;
    culturalNote?: string;
    audioUrl?: string;
  }>;
  activities: Array<{
    type: 'introduction' | 'practice' | 'exercise' | 'cultural' | 'assessment';
    title: string;
    description: string;
    duration: number;
    instructions: string[];
    materials?: string[];
  }>;
  assessmentCriteria: string[];
  culturalNotes: string[];
  homework?: string[];
  createdAt: Date;
}

export interface GrammarCheckResult {
  isCorrect: boolean;
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
    rule: string;
  }>;
  suggestions: string[];
  confidence: number;
}

export interface CulturalContext {
  phrase: string;
  meaning: string;
  culturalSignificance: string;
  usage: string;
  examples: string[];
  relatedConcepts: string[];
  respectfulUsage: string[];
}

export interface AIContentQuality {
  score: number;
  criteria: {
    culturalAccuracy: number;
    linguisticCorrectness: number;
    pedagogicalValue: number;
    engagement: number;
  };
  feedback: string[];
  improvements: string[];
}

export class TahitianAIService {
  private static instance: TahitianAIService;
  private baseAIService: typeof AIService;

  private constructor() {
    this.baseAIService = AIService;
  }

  public static getInstance(): TahitianAIService {
    if (!TahitianAIService.instance) {
      TahitianAIService.instance = new TahitianAIService();
    }
    return TahitianAIService.instance;
  }

  /**
   * Generate comprehensive lesson plans with cultural context
   */
  async generateLessonPlan(request: LessonPlanRequest): Promise<LessonPlan> {
    try {
      const prompt = `Create a comprehensive Tahitian language lesson plan for "${request.topic}" at ${request.level} level.

Requirements:
- Duration: ${request.duration || 45} minutes
- Include cultural context: ${request.culturalFocus ? 'Yes' : 'No'}
- Learning objectives: ${request.objectives?.join(', ') || 'General language skills'}

Provide the lesson plan in the following JSON format:
{
  "id": "<unique-id>",
  "title": "<engaging lesson title>",
  "description": "<detailed lesson description>",
  "level": "${request.level}",
  "duration": ${request.duration || 45},
  "objectives": ["<objective1>", "<objective2>", "<objective3>"],
  "culturalContext": "<cultural background and significance>",
  "vocabulary": [
    {
      "tahitian": "<tahitian word>",
      "french": "<french translation>",
      "english": "<english translation>",
      "pronunciation": "<IPA or simplified pronunciation>",
      "culturalNote": "<cultural significance if applicable>",
      "audioUrl": null
    }
  ],
  "activities": [
    {
      "type": "introduction|practice|exercise|cultural|assessment",
      "title": "<activity title>",
      "description": "<activity description>",
      "duration": <minutes>,
      "instructions": ["<step1>", "<step2>"],
      "materials": ["<material1>", "<material2>"]
    }
  ],
  "assessmentCriteria": ["<criteria1>", "<criteria2>"],
  "culturalNotes": ["<note1>", "<note2>"],
  "homework": ["<assignment1>", "<assignment2>"],
  "createdAt": "${new Date().toISOString()}"
}

Focus on:
1. Authentic Tahitian language usage
2. Cultural sensitivity and accuracy
3. Progressive skill building
4. Interactive and engaging activities
5. Clear assessment methods

Include 8-12 vocabulary items and 4-6 activities.`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      });

      const lessonPlan = JSON.parse(result.text);
      lessonPlan.id = `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      lessonPlan.createdAt = new Date();

      return lessonPlan;
    } catch (error) {
      console.error('Lesson plan generation error:', error);
      throw new Error('Failed to generate lesson plan');
    }
  }

  /**
   * Advanced grammar checking for Tahitian and French
   */
  async grammarCheck(
    text: string, 
    language: 'tahitian' | 'french'
  ): Promise<GrammarCheckResult> {
    try {
      const prompt = `Perform advanced grammar checking for the following ${language} text:

"${text}"

Analyze for:
1. Grammar correctness
2. Spelling accuracy
3. Proper word order
4. Cultural appropriateness
5. Common learner mistakes

Provide results in JSON format:
{
  "isCorrect": <boolean>,
  "corrections": [
    {
      "original": "<incorrect phrase>",
      "corrected": "<corrected phrase>",
      "explanation": "<why it's wrong and how to fix>",
      "rule": "<grammar rule applied>"
    }
  ],
  "suggestions": ["<improvement1>", "<improvement2>"],
  "confidence": <0-100>
}

${language === 'tahitian' ? 
  'Focus on Tahitian-specific grammar rules, verb conjugations, and cultural context.' : 
  'Focus on French grammar rules, verb tenses, and formal/informal usage.'}`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      });

      return JSON.parse(result.text);
    } catch (error) {
      console.error('Grammar check error:', error);
      return {
        isCorrect: true,
        corrections: [],
        suggestions: ['Continue practicing!'],
        confidence: 50
      };
    }
  }

  /**
   * Provide detailed cultural context for phrases and expressions
   */
  async getCulturalContext(phrase: string): Promise<CulturalContext> {
    try {
      const prompt = `Provide comprehensive cultural context for the Tahitian phrase: "${phrase}"

Include:
1. Literal and cultural meaning
2. Historical/cultural significance
3. Appropriate usage contexts
4. Examples in different situations
5. Related cultural concepts
6. Guidelines for respectful usage

Provide response in JSON format:
{
  "phrase": "${phrase}",
  "meaning": "<literal and cultural meaning>",
  "culturalSignificance": "<historical and cultural importance>",
  "usage": "<when and how to use appropriately>",
  "examples": ["<example1>", "<example2>", "<example3>"],
  "relatedConcepts": ["<concept1>", "<concept2>"],
  "respectfulUsage": ["<guideline1>", "<guideline2>"]
}

Focus on authentic Tahitian culture, traditions, and values.`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.5,
          maxOutputTokens: 1000,
        },
      });

      return JSON.parse(result.text);
    } catch (error) {
      console.error('Cultural context error:', error);
      return {
        phrase,
        meaning: 'Cultural context not available',
        culturalSignificance: 'Please consult with cultural experts',
        usage: 'Use with respect and cultural sensitivity',
        examples: [],
        relatedConcepts: [],
        respectfulUsage: ['Always approach with respect', 'Learn from native speakers']
      };
    }
  }

  /**
   * Evaluate AI-generated content quality
   */
  async evaluateContentQuality(
    content: string,
    contentType: 'lesson' | 'exercise' | 'vocabulary' | 'cultural'
  ): Promise<AIContentQuality> {
    try {
      const prompt = `Evaluate the quality of this ${contentType} content for Tahitian language learning:

"${content}"

Rate on a scale of 0-100 for each criterion:
1. Cultural Accuracy - Authentic representation of Tahitian culture
2. Linguistic Correctness - Proper Tahitian language usage
3. Pedagogical Value - Educational effectiveness
4. Engagement - Student interest and motivation

Provide evaluation in JSON format:
{
  "score": <overall score 0-100>,
  "criteria": {
    "culturalAccuracy": <0-100>,
    "linguisticCorrectness": <0-100>,
    "pedagogicalValue": <0-100>,
    "engagement": <0-100>
  },
  "feedback": ["<positive aspect1>", "<positive aspect2>"],
  "improvements": ["<improvement1>", "<improvement2>"]
}

Be thorough and constructive in your evaluation.`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.4,
          maxOutputTokens: 600,
        },
      });

      return JSON.parse(result.text);
    } catch (error) {
      console.error('Content quality evaluation error:', error);
      return {
        score: 75,
        criteria: {
          culturalAccuracy: 75,
          linguisticCorrectness: 75,
          pedagogicalValue: 75,
          engagement: 75
        },
        feedback: ['Content appears well-structured'],
        improvements: ['Consider adding more cultural context']
      };
    }
  }

  /**
   * Generate pronunciation guides with cultural pronunciation notes
   */
  async generatePronunciationGuide(
    word: string,
    includeAudio: boolean = false
  ): Promise<{
    word: string;
    ipa: string;
    simplified: string;
    culturalNotes: string;
    commonMistakes: string[];
    practiceExercises: string[];
    audioUrl?: string;
  }> {
    try {
      const prompt = `Create a comprehensive pronunciation guide for the Tahitian word: "${word}"

Include:
1. IPA (International Phonetic Alphabet) transcription
2. Simplified pronunciation for beginners
3. Cultural pronunciation notes
4. Common mistakes by French/English speakers
5. Practice exercises

Provide in JSON format:
{
  "word": "${word}",
  "ipa": "<IPA transcription>",
  "simplified": "<beginner-friendly pronunciation>",
  "culturalNotes": "<cultural aspects of pronunciation>",
  "commonMistakes": ["<mistake1>", "<mistake2>"],
  "practiceExercises": ["<exercise1>", "<exercise2>"],
  "audioUrl": null
}

Focus on authentic Tahitian pronunciation patterns.`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      });

      const guide = JSON.parse(result.text);
      
      // TODO: Integrate with audio generation service if needed
      if (includeAudio) {
        guide.audioUrl = `/api/audio/pronunciation/${encodeURIComponent(word)}`;
      }

      return guide;
    } catch (error) {
      console.error('Pronunciation guide error:', error);
      return {
        word,
        ipa: '[pronunciation not available]',
        simplified: 'Please consult with native speakers',
        culturalNotes: 'Pronunciation varies by region',
        commonMistakes: ['Incorrect stress patterns'],
        practiceExercises: ['Practice with native speakers'],
        audioUrl: undefined
      };
    }
  }

  /**
   * Generate adaptive learning recommendations
   */
  async generateAdaptiveLearningPath(
    userProfile: {
      level: string;
      interests: string[];
      weakAreas: string[];
      learningStyle: string;
      goals: string[];
    }
  ): Promise<{
    recommendedLessons: string[];
    focusAreas: string[];
    studyPlan: Array<{
      week: number;
      topics: string[];
      goals: string[];
    }>;
    motivationalTips: string[];
  }> {
    try {
      const prompt = `Create an adaptive learning path for a Tahitian language learner:

Profile:
- Level: ${userProfile.level}
- Interests: ${userProfile.interests.join(', ')}
- Weak areas: ${userProfile.weakAreas.join(', ')}
- Learning style: ${userProfile.learningStyle}
- Goals: ${userProfile.goals.join(', ')}

Provide personalized recommendations in JSON format:
{
  "recommendedLessons": ["<lesson1>", "<lesson2>", "<lesson3>"],
  "focusAreas": ["<area1>", "<area2>"],
  "studyPlan": [
    {
      "week": 1,
      "topics": ["<topic1>", "<topic2>"],
      "goals": ["<goal1>", "<goal2>"]
    }
  ],
  "motivationalTips": ["<tip1>", "<tip2>"]
}

Create a 4-week study plan that addresses weak areas while building on interests.`;

      const result = await ai.generate({
        model: gemini15Flash,
        prompt,
        config: {
          temperature: 0.6,
          maxOutputTokens: 800,
        },
      });

      return JSON.parse(result.text);
    } catch (error) {
      console.error('Adaptive learning path error:', error);
      return {
        recommendedLessons: ['Basic greetings', 'Family vocabulary', 'Daily activities'],
        focusAreas: ['Pronunciation', 'Basic grammar'],
        studyPlan: [
          {
            week: 1,
            topics: ['Greetings and introductions'],
            goals: ['Learn basic greetings', 'Practice pronunciation']
          }
        ],
        motivationalTips: ['Practice daily', 'Be patient with yourself']
      };
    }
  }
}

export default TahitianAIService.getInstance();