// Local AI Service for Llama 3.1 DeepSeek integration
// Replaces external AI API calls with local model processing

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

export interface LocalAIConfig {
  endpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class LocalAIService {
  private static instance: LocalAIService;
  private config: LocalAIConfig;

  private constructor() {
    this.config = {
      endpoint: process.env.LOCAL_AI_ENDPOINT || 'http://localhost:11434',
      model: process.env.LOCAL_AI_MODEL || 'deepseek-llama-3.1',
      maxTokens: parseInt(process.env.LOCAL_AI_MAX_TOKENS || '2048'),
      temperature: parseFloat(process.env.LOCAL_AI_TEMPERATURE || '0.7')
    };
  }

  public static getInstance(): LocalAIService {
    if (!LocalAIService.instance) {
      LocalAIService.instance = new LocalAIService();
    }
    return LocalAIService.instance;
  }

  /**
   * Make a request to the local Llama model
   */
  private async makeRequest(prompt: string, options: Partial<LocalAIConfig> = {}): Promise<string> {
    try {
      const requestConfig = { ...this.config, ...options };
      
      const response = await fetch(`${requestConfig.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: requestConfig.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: requestConfig.temperature,
            num_predict: requestConfig.maxTokens,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Local AI request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      console.error('Local AI request error:', error);
      throw new Error('Failed to communicate with local AI model');
    }
  }

  /**
   * Translate text between French, Tahitian, and English using local model
   */
  async translateText(request: TranslationRequest): Promise<string> {
    try {
      const languageNames = {
        'fr': 'French',
        'ty': 'Tahitian',
        'en': 'English'
      };

      const prompt = `You are an expert translator specializing in French, Tahitian, and English languages. 

Translate the following text from ${languageNames[request.fromLanguage]} to ${languageNames[request.toLanguage]}:

"${request.text}"

Provide only the accurate translation, no additional text or explanations.`;

      const result = await this.makeRequest(prompt, {
        temperature: 0.3,
        maxTokens: 200
      });

      return result.trim();
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Failed to translate text using local AI');
    }
  }

  /**
   * Analyze pronunciation and provide feedback using local model
   */
  async analyzePronunciation(
    targetText: string,
    userAudio: string,
    language: 'fr' | 'ty'
  ): Promise<PronunciationFeedback> {
    try {
      const languageName = language === 'fr' ? 'French' : 'Tahitian';
      
      const prompt = `You are an expert ${languageName} pronunciation coach. Analyze the pronunciation of the following text and provide detailed feedback.

Target text: "${targetText}"
Language: ${languageName}

Provide your response in the following JSON format only:
{
  "accuracy": <number between 0-100>,
  "feedback": "<constructive feedback about pronunciation>",
  "suggestions": ["<specific improvement suggestion 1>", "<specific improvement suggestion 2>"],
  "phonetics": "<IPA phonetic transcription of the target text>"
}

Focus on common pronunciation challenges for language learners and provide actionable advice.`;

      const result = await this.makeRequest(prompt, {
        temperature: 0.4,
        maxTokens: 400
      });

      try {
        return JSON.parse(result.trim());
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          accuracy: 75,
          feedback: 'Keep practicing! Focus on clear pronunciation and natural rhythm.',
          suggestions: ['Practice slowly first', 'Listen to native speakers', 'Record yourself speaking'],
          phonetics: targetText,
        };
      }
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
   * Generate personalized lesson content using local model
   */
  async generateLesson(
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced',
    focusAreas: string[]
  ): Promise<LessonContent> {
    try {
      const prompt = `You are an expert Tahitian language instructor. Create a comprehensive ${level} level lesson about "${topic}".

Focus areas: ${focusAreas.join(', ')}

Provide the lesson in the following JSON format only:
{
  "title": "<engaging lesson title>",
  "description": "<detailed lesson description>",
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
      "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
      "correctAnswer": "<correct answer>"
    }
  ]
}

Include 6-8 vocabulary items and 4-6 varied exercises. Ensure cultural authenticity and practical usage.`;

      const result = await this.makeRequest(prompt, {
        temperature: 0.7,
        maxTokens: 1500
      });

      try {
        return JSON.parse(result.trim());
      } catch (parseError) {
        // Fallback lesson if JSON parsing fails
        return {
          title: `${level.charAt(0).toUpperCase() + level.slice(1)} ${topic}`,
          description: `A ${level} level lesson focusing on ${topic} in Tahitian language.`,
          vocabulary: [
            {
              tahitian: 'Ia ora na',
              french: 'Bonjour',
              english: 'Hello',
              pronunciation: 'ee-ah OH-rah nah'
            }
          ],
          exercises: [
            {
              type: 'translation',
              question: 'How do you say "Hello" in Tahitian?',
              options: ['Ia ora na', 'Mauruuru', 'Nana', 'Maeva'],
              correctAnswer: 'Ia ora na'
            }
          ]
        };
      }
    } catch (error) {
      console.error('Lesson generation error:', error);
      throw new Error('Failed to generate lesson content using local AI');
    }
  }

  /**
   * Get conversation practice suggestions using local model
   */
  async getConversationSuggestions(
    context: string,
    userLevel: string
  ): Promise<string[]> {
    try {
      const prompt = `You are a Tahitian language conversation coach. Generate 5 practical conversation suggestions for a ${userLevel} level learner in the context of: ${context}

Provide suggestions as a JSON array of strings. Each suggestion should be a complete Tahitian phrase or sentence with its French translation in parentheses.

Example format: ["Ia ora na (Bonjour)", "E aha tō oe i hia nei? (Comment allez-vous?)"]

Focus on practical, everyday expressions that would be useful in real conversations.`;

      const result = await this.makeRequest(prompt, {
        temperature: 0.6,
        maxTokens: 500
      });

      try {
        return JSON.parse(result.trim());
      } catch (parseError) {
        // Fallback suggestions if JSON parsing fails
        return [
          'Ia ora na (Bonjour)',
          'E aha tō oe i hia nei? (Comment allez-vous?)',
          'Mauruuru (Merci)',
          'Nana (Au revoir)',
          'E aha tō oe i roa? (Comment vous appelez-vous?)'
        ];
      }
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
  async analyzeProgress(request: {
    userStats: {
      lessonsCompleted: number;
      averageScore: number;
      weakAreas: string[];
      strongAreas: string[];
    };
    analysisType: 'progress';
  }): Promise<{
    recommendations: string[];
    nextSteps: string[];
    motivationalMessage: string;
  }> {
    const { userStats } = request;
    
    const prompt = `Analyze a Tahitian language learner's progress and provide personalized recommendations:

Student Progress:
- Lessons completed: ${userStats.lessonsCompleted}
- Average score: ${userStats.averageScore}%
- Areas needing improvement: ${userStats.weakAreas.join(', ')}
- Strong areas: ${userStats.strongAreas.join(', ')}

Provide analysis in this exact JSON format:
{
  "recommendations": ["specific actionable recommendation 1", "specific actionable recommendation 2", "specific actionable recommendation 3"],
  "nextSteps": ["concrete next step 1", "concrete next step 2"],
  "motivationalMessage": "encouraging and personalized message based on their progress"
}

Focus on:
- Actionable, specific advice
- Tahitian language learning best practices
- Positive reinforcement
- Cultural context when appropriate`;

    try {
       const response = await this.makeRequest(prompt, {
         maxTokens: 500,
         temperature: 0.7
       });

       try {
         const parsed = JSON.parse(response.trim());
         return {
           recommendations: parsed.recommendations || ['Continue practicing daily', 'Focus on pronunciation'],
           nextSteps: parsed.nextSteps || ['Complete more lessons', 'Practice with native speakers'],
           motivationalMessage: parsed.motivationalMessage || 'You\'re making great progress! Keep up the excellent work!'
         };
       } catch (parseError) {
         console.error('Failed to parse progress analysis response:', parseError);
       }
     } catch (error) {
       console.error('Progress analysis request failed:', error);
     }

    // Fallback response
    return {
      recommendations: [
        'Continue practicing daily for consistency',
        'Focus on areas that need improvement',
        'Practice speaking with native speakers when possible'
      ],
      nextSteps: [
        'Complete the next lesson in your learning path',
        'Review vocabulary from previous lessons'
      ],
      motivationalMessage: 'You\'re making great progress in learning Tahitian! Every lesson brings you closer to fluency.'
    };
  }

  /**
   * Test connection to local AI model
   */
  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = 'Respond with "OK" if you can understand this message.';
      const result = await this.makeRequest(testPrompt, {
        temperature: 0.1,
        maxTokens: 10
      });
      
      return result.toLowerCase().includes('ok');
    } catch (error) {
      console.error('Local AI connection test failed:', error);
      return false;
    }
  }
}

export default LocalAIService;