import { Audio } from 'expo-av';
import {
  TTSConfig,
  TTSRequest,
  TTSResponse,
  TTSError,
  TTSLanguage,
  FREE_TTS_CONFIG,
  TTS_MODELS,
} from '../types/tts';

export class TTSService {
  private config: TTSConfig;
  private sound: Audio.Sound | null = null;
  private isInitialized = false;

  constructor(config: TTSConfig = FREE_TTS_CONFIG) {
    this.config = config;
  }

  /**
   * Initialize the TTS service and check server connectivity
   */
  async initialize(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        this.isInitialized = true;
        return true;
      }
      
      throw new Error(`Server responded with status: ${response.status}`);
    } catch (error) {
      console.warn('TTS Server not available:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Generate audio from text using the specified language
   */
  async generateAudio(
    text: string,
    language: TTSLanguage = 'french'
  ): Promise<TTSResponse> {
    if (!text.trim()) {
      throw new TTSError('Text cannot be empty', 'INVALID_INPUT');
    }

    // Check if server is available, if not, try to initialize
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new TTSError(
          'TTS server is not available. Please ensure Coqui TTS is running on localhost:5002',
          'SERVER_UNAVAILABLE'
        );
      }
    }

    const model = TTS_MODELS[language];
    if (!model) {
      throw new TTSError(`Unsupported language: ${language}`, 'UNSUPPORTED_LANGUAGE');
    }

    const request: TTSRequest = {
      text: text.trim(),
      model,
      speaker_id: this.config.defaultSpeakerId,
      language_id: this.config.defaultLanguageId,
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new TTSError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          'API_ERROR'
        );
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audioUrl,
        text,
        language,
        model,
        duration: 0, // Will be set when audio loads
        success: true,
      };
    } catch (error) {
      if (error instanceof TTSError) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new TTSError(
          'Network error: Unable to connect to TTS server',
          'NETWORK_ERROR'
        );
      }
      
      throw new TTSError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Play audio from a TTS response
   */
  async playAudio(
    audioUrl: string,
    options: { volume?: number; shouldLoop?: boolean } = {}
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stopAudio();

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          volume: options.volume ?? 1.0,
          isLooping: options.shouldLoop ?? false,
        }
      );

      this.sound = sound;

      // Set up playback status update
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.cleanup();
        }
      });
    } catch (error) {
      throw new TTSError(
        `Audio playback error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PLAYBACK_ERROR'
      );
    }
  }

  /**
   * Stop currently playing audio
   */
  async stopAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        console.warn('Error stopping audio:', error);
      } finally {
        this.sound = null;
      }
    }
  }

  /**
   * Pause currently playing audio
   */
  async pauseAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.pauseAsync();
      } catch (error) {
        console.warn('Error pausing audio:', error);
      }
    }
  }

  /**
   * Resume paused audio
   */
  async resumeAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.playAsync();
      } catch (error) {
        console.warn('Error resuming audio:', error);
      }
    }
  }

  /**
   * Get current playback status
   */
  async getPlaybackStatus(): Promise<any> {
    if (this.sound) {
      try {
        return await this.sound.getStatusAsync();
      } catch (error) {
        console.warn('Error getting playback status:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Check if TTS server is available
   */
  async isServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available models from the server
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/models`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.models || [];
      }
      
      return [];
    } catch (error) {
      console.warn('Error fetching available models:', error);
      return [];
    }
  }

  /**
   * Update TTS configuration
   */
  updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Reset initialization status if base URL changed
    if ('baseUrl' in newConfig) {
      this.isInitialized = false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.sound) {
      this.sound.unloadAsync().catch(console.warn);
      this.sound = null;
    }
  }

  /**
   * Dispose of the service and clean up all resources
   */
  async dispose(): Promise<void> {
    await this.stopAudio();
    this.cleanup();
    this.isInitialized = false;
  }
}

// Export a singleton instance for convenience
export const ttsService = new TTSService();

// Export the class for custom instances
export default TTSService;