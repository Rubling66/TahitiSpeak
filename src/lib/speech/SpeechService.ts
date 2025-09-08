// Web Speech API service for pronunciation practice and feedback

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
    speechSynthesis: SpeechSynthesis;
  }
}

export interface PronunciationResult {
  transcript: string;
  confidence: number;
  accuracy: number;
  feedback: string;
  suggestions: string[];
}

export interface SpeechOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface TTSOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export class SpeechService {
  private static instance: SpeechService;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isSupported = false;
  private availableVoices: SpeechSynthesisVoice[] = [];

  private constructor() {
    this.checkSupport();
    this.initializeSynthesis();
  }

  static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  private checkSupport(): void {
    this.isSupported = 
      'SpeechRecognition' in window || 
      'webkitSpeechRecognition' in window;
    
    if (!this.isSupported) {
      console.warn('Speech Recognition API not supported in this browser');
    }
  }

  private initializeSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      
      // Load available voices
      const loadVoices = () => {
        this.availableVoices = this.synthesis!.getVoices();
      };
      
      loadVoices();
      
      // Some browsers load voices asynchronously
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  isRecognitionSupported(): boolean {
    return this.isSupported;
  }

  isSynthesisSupported(): boolean {
    return this.synthesis !== null;
  }

  getAvailableVoices(language?: string): SpeechSynthesisVoice[] {
    if (!language) {
      return this.availableVoices;
    }
    
    return this.availableVoices.filter(voice => 
      voice.lang.toLowerCase().includes(language.toLowerCase())
    );
  }

  async startListening(
    targetText: string,
    options: SpeechOptions = {}
  ): Promise<PronunciationResult> {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      throw new Error('Already listening');
    }

    return new Promise((resolve, reject) => {
      try {
        // Create recognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configure recognition
        this.recognition.continuous = options.continuous || false;
        this.recognition.interimResults = options.interimResults || false;
        this.recognition.lang = options.language || 'ty-PF'; // Tahitian
        this.recognition.maxAlternatives = options.maxAlternatives || 3;

        let hasResult = false;

        this.recognition.onstart = () => {
          this.isListening = true;
          console.log('Speech recognition started');
        };

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          if (hasResult) return;
          hasResult = true;

          const result = event.results[event.resultIndex];
          const transcript = result[0].transcript.trim();
          const confidence = result[0].confidence || 0;

          // Analyze pronunciation
          const analysis = this.analyzePronunciation(transcript, targetText);
          
          resolve({
            transcript,
            confidence,
            accuracy: analysis.accuracy,
            feedback: analysis.feedback,
            suggestions: analysis.suggestions
          });
        };

        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          this.isListening = false;
          console.error('Speech recognition error:', event.error);
          
          let errorMessage = 'Speech recognition failed';
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please try speaking clearly.';
              break;
            case 'audio-capture':
              errorMessage = 'Microphone access denied or not available.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone permission denied.';
              break;
            case 'network':
              errorMessage = 'Network error occurred.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          
          reject(new Error(errorMessage));
        };

        this.recognition.onend = () => {
          this.isListening = false;
          console.log('Speech recognition ended');
          
          if (!hasResult) {
            reject(new Error('No speech detected'));
          }
        };

        // Start recognition
        this.recognition.start();
        
        // Auto-stop after 10 seconds
        setTimeout(() => {
          if (this.isListening && this.recognition) {
            this.recognition.stop();
          }
        }, 10000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  private analyzePronunciation(spoken: string, target: string): {
    accuracy: number;
    feedback: string;
    suggestions: string[];
  } {
    const spokenLower = spoken.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();
    
    // Simple similarity calculation (Levenshtein distance)
    const similarity = this.calculateSimilarity(spokenLower, targetLower);
    const accuracy = Math.round(similarity * 100);
    
    let feedback = '';
    const suggestions: string[] = [];
    
    if (accuracy >= 90) {
      feedback = 'Excellent pronunciation! 🎉';
    } else if (accuracy >= 75) {
      feedback = 'Good pronunciation! Keep practicing. 👍';
      suggestions.push('Try to pronounce each syllable clearly');
    } else if (accuracy >= 50) {
      feedback = 'Getting there! Focus on the pronunciation. 📚';
      suggestions.push('Listen to the audio again');
      suggestions.push('Break the word into smaller parts');
    } else {
      feedback = 'Keep practicing! Try listening to the audio first. 💪';
      suggestions.push('Listen to the native pronunciation');
      suggestions.push('Practice saying each syllable slowly');
      suggestions.push('Record yourself and compare');
    }
    
    return { accuracy, feedback, suggestions };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Calculate Levenshtein distance
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    return (maxLength - distance) / maxLength;
  }

  async speak(
    text: string, 
    options: TTSOptions = {}
  ): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported');
    }

    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        this.synthesis!.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure utterance
        utterance.rate = options.rate || 0.8; // Slightly slower for learning
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;
        utterance.lang = options.lang || 'ty-PF'; // Tahitian
        
        // Set voice if specified
        if (options.voice) {
          utterance.voice = options.voice;
        } else {
          // Try to find a suitable voice
          const voices = this.getAvailableVoices(utterance.lang);
          if (voices.length > 0) {
            utterance.voice = voices[0];
          }
        }

        utterance.onend = () => {
          resolve();
        };

        utterance.onerror = (event) => {
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        this.synthesis!.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately as we only needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  getRecognitionLanguages(): string[] {
    // Common languages supported by most browsers
    return [
      'ty-PF', // Tahitian (French Polynesia)
      'fr-FR', // French (France)
      'en-US', // English (US)
      'en-GB'  // English (UK)
    ];
  }

  isListeningActive(): boolean {
    return this.isListening;
  }

  cleanup(): void {
    this.stopListening();
    this.stopSpeaking();
  }
}

// Export singleton instance
export const speechService = SpeechService.getInstance();