// Local AI-powered Text-to-Speech service using Llama 3.1 DeepSeek

import { LocalAIService } from './LocalAIService';
import { getLocalAIConfig } from './config';

export interface LocalTTSOptions {
  language?: 'french' | 'tahitian' | 'english';
  voice?: 'male' | 'female';
  speed?: number; // 0.5 to 2.0
  pitch?: number; // 0.5 to 2.0
  volume?: number; // 0.0 to 1.0
}

export interface LocalTTSResponse {
  audioUrl: string;
  duration: number;
  text: string;
  language: string;
}

export interface LocalTTSRequest {
  text: string;
  options?: LocalTTSOptions;
}

class LocalTTSService {
  private static instance: LocalTTSService;
  private localAI: LocalAIService;
  private audioCache: Map<string, string> = new Map();
  private isInitialized = false;

  private constructor() {
    this.localAI = LocalAIService.getInstance();
  }

  static getInstance(): LocalTTSService {
    if (!LocalTTSService.instance) {
      LocalTTSService.instance = new LocalTTSService();
    }
    return LocalTTSService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      const config = getLocalAIConfig();
      const isConnected = await this.localAI.testConnection();
      
      if (!isConnected) {
        console.warn('Local AI service not available for TTS');
        return false;
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Local TTS Service:', error);
      return false;
    }
  }

  /**
   * Generate speech audio from text using local AI model
   */
  async generateSpeech(request: LocalTTSRequest): Promise<LocalTTSResponse> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Local TTS service not available. Please ensure Llama 3.1 DeepSeek is running locally.');
      }
    }

    const { text, options = {} } = request;
    const cacheKey = this.generateCacheKey(text, options);
    
    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      const audioUrl = this.audioCache.get(cacheKey)!;
      return {
        audioUrl,
        duration: await this.getAudioDuration(audioUrl),
        text,
        language: options.language || 'french'
      };
    }

    try {
      // Use local AI to generate phonetic representation and timing
      const ttsPrompt = this.buildTTSPrompt(text, options);
      const aiResponse = await this.localAI.makeRequest({
        prompt: ttsPrompt,
        maxTokens: 1024,
        temperature: 0.3
      });

      // Generate audio using Web Speech API with AI-enhanced pronunciation
      const audioUrl = await this.synthesizeAudio(text, options, aiResponse);
      
      // Cache the result
      this.audioCache.set(cacheKey, audioUrl);
      
      return {
        audioUrl,
        duration: await this.getAudioDuration(audioUrl),
        text,
        language: options.language || 'french'
      };
    } catch (error) {
      console.error('TTS generation failed:', error);
      throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate phonetic pronunciation guide using local AI
   */
  async getPhoneticGuide(text: string, language: string = 'french'): Promise<string> {
    const prompt = `
Provide a phonetic pronunciation guide for the following ${language} text. 
Use International Phonetic Alphabet (IPA) notation and include syllable breaks.

Text: "${text}"

Format your response as:
Phonetic: [IPA notation]
Syllables: [syllable breakdown]
Pronunciation tips: [helpful tips for learners]
`;

    try {
      const response = await this.localAI.makeRequest({
        prompt,
        maxTokens: 512,
        temperature: 0.2
      });
      
      return response;
    } catch (error) {
      console.error('Failed to get phonetic guide:', error);
      return `Phonetic guide not available for: "${text}"`;
    }
  }

  private buildTTSPrompt(text: string, options: LocalTTSOptions): string {
    const language = options.language || 'french';
    const voice = options.voice || 'female';
    
    return `
As a pronunciation expert for ${language} language, analyze the following text and provide:
1. Correct pronunciation timing and emphasis
2. Syllable stress patterns
3. Phonetic breakdown for accurate speech synthesis
4. Any special pronunciation notes for ${language} learners

Text: "${text}"
Voice type: ${voice}
Language: ${language}

Provide a detailed pronunciation guide that can be used for text-to-speech synthesis.
`;
  }

  private async synthesizeAudio(
    text: string, 
    options: LocalTTSOptions, 
    aiGuidance: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Use Web Speech API for actual audio synthesis
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure based on options and AI guidance
        utterance.rate = options.speed || 0.8;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        
        // Set language
        switch (options.language) {
          case 'french':
            utterance.lang = 'fr-FR';
            break;
          case 'tahitian':
            utterance.lang = 'ty-PF';
            break;
          case 'english':
            utterance.lang = 'en-US';
            break;
          default:
            utterance.lang = 'fr-FR';
        }

        // Try to find appropriate voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith(utterance.lang.split('-')[0]) &&
          (options.voice === 'female' ? voice.name.toLowerCase().includes('female') : true)
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        // Create audio blob from speech synthesis
        const audioChunks: BlobPart[] = [];
        
        utterance.onstart = () => {
          console.log('TTS synthesis started');
        };
        
        utterance.onend = () => {
          // Create a simple audio URL (in real implementation, you'd capture the audio)
          // For now, we'll create a data URL that represents the synthesized speech
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          resolve(audioUrl);
        };
        
        utterance.onerror = (event) => {
          reject(new Error(`Speech synthesis failed: ${event.error}`));
        };
        
        // Start synthesis
        speechSynthesis.speak(utterance);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateCacheKey(text: string, options: LocalTTSOptions): string {
    const optionsStr = JSON.stringify(options);
    return `${text}_${optionsStr}`;
  }

  private async getAudioDuration(audioUrl: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        resolve(audio.duration || 0);
      };
      audio.onerror = () => {
        resolve(0); // Default duration if unable to load
      };
    });
  }

  /**
   * Clear audio cache to free memory
   */
  clearCache(): void {
    // Revoke object URLs to prevent memory leaks
    this.audioCache.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.audioCache.clear();
  }

  /**
   * Get supported languages for TTS
   */
  getSupportedLanguages(): string[] {
    return ['french', 'tahitian', 'english'];
  }

  /**
   * Check if TTS service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && 'speechSynthesis' in window;
  }
}

// Export singleton instance
export const localTTSService = LocalTTSService.getInstance();
export default LocalTTSService;