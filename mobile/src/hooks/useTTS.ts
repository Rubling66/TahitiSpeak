import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { ttsService, TTSService } from '../services/TTSService';
import SubscriptionService from '../services/SubscriptionService';
import { Audio } from 'expo-av';
import {
  TTSState,
  TTSLanguage,
  TTSResponse,
  TTSError,
  AudioPlaybackOptions,
} from '../types/tts';

interface UseTTSOptions {
  autoPlay?: boolean;
  volume?: number;
  onSuccess?: (response: TTSResponse) => void;
  onError?: (error: TTSError) => void;
  onPlaybackComplete?: () => void;
  onUpgradeRequired?: () => void;
}

interface UseTTSReturn {
  // State
  state: TTSState;
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  error: TTSError | null;
  currentAudio: TTSResponse | null;
  isServerAvailable: boolean;
  
  // Actions
  generateAndPlay: (text: string, language?: TTSLanguage) => Promise<void>;
  generateAudio: (text: string, language?: TTSLanguage) => Promise<TTSResponse | null>;
  playAudio: (audioUrl: string, options?: AudioPlaybackOptions) => Promise<void>;
  stopAudio: () => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  clearError: () => void;
  checkServerStatus: () => Promise<boolean>;
  
  // Utilities
  canUseFreeTTS: boolean;
  supportedLanguages: TTSLanguage[];
}

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const {
    autoPlay = true,
    volume = 1.0,
    onSuccess,
    onError,
    onPlaybackComplete,
  } = options;

  // State
  const [state, setState] = useState<TTSState>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<TTSError | null>(null);
  const [currentAudio, setCurrentAudio] = useState<TTSResponse | null>(null);
  const [isServerAvailable, setIsServerAvailable] = useState(false);

  // Refs
  const serviceRef = useRef<TTSService>(ttsService);
  const playbackStatusRef = useRef<any>(null);

  // Supported languages
  const supportedLanguages: TTSLanguage[] = ['french', 'english'];
  const canUseFreeTTS = isServerAvailable;

  // Initialize and check server status
  useEffect(() => {
    let mounted = true;

    const initializeService = async () => {
      try {
        const available = await serviceRef.current.initialize();
        if (mounted) {
          setIsServerAvailable(available);
        }
      } catch (err) {
        if (mounted) {
          setIsServerAvailable(false);
          console.warn('TTS service initialization failed:', err);
        }
      }
    };

    initializeService();

    return () => {
      mounted = false;
    };
  }, []);

  // Monitor playback status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && !isPaused) {
      interval = setInterval(async () => {
        try {
          const status = await serviceRef.current.getPlaybackStatus();
          if (status && status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
              setIsPaused(false);
              setState('idle');
              onPlaybackComplete?.();
            }
          }
        } catch (err) {
          console.warn('Error checking playback status:', err);
        }
      }, 500);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, isPaused, onPlaybackComplete]);

  // Clear error when state changes
  useEffect(() => {
    if (state !== 'error') {
      setError(null);
    }
  }, [state]);

  // Generate audio from text
  const generateAudio = useCallback(async (
    text: string,
    language: TTSLanguage = 'french'
  ): Promise<TTSResponse | null> => {
    if (!text.trim()) {
      const error = new TTSError('Text cannot be empty', 'INVALID_INPUT');
      setError(error);
      setState('error');
      onError?.(error);
      return null;
    }

    if (!supportedLanguages.includes(language)) {
      const error = new TTSError(`Unsupported language: ${language}`, 'UNSUPPORTED_LANGUAGE');
      setError(error);
      setState('error');
      onError?.(error);
      return null;
    }

    try {
      // Check TTS usage limits
      const usage = await SubscriptionService.getTTSUsageLimit();
      
      if (!usage.unlimited && usage.used >= usage.limit) {
        Alert.alert(
          'TTS Limit Reached',
          `You've reached your daily limit of ${usage.limit} TTS generations. Upgrade to Premium for unlimited usage!`,
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => options.onUpgradeRequired?.() }
          ]
        );
        return null;
      }

      setIsLoading(true);
      setState('generating');
      setError(null);

      const response = await serviceRef.current.generateAudio(text, language);
      
      // Increment usage count for free users
      await SubscriptionService.incrementTTSUsage();
      
      setCurrentAudio(response);
      setState('idle');
      onSuccess?.(response);
      
      return response;
    } catch (err) {
      const error = err instanceof TTSError ? err : new TTSError(
        `Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'GENERATION_ERROR'
      );
      
      setError(error);
      setState('error');
      onError?.(error);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supportedLanguages, onSuccess, onError, options]);

  // Play audio from URL
  const playAudio = useCallback(async (
    audioUrl: string,
    playbackOptions: AudioPlaybackOptions = {}
  ): Promise<void> => {
    try {
      setState('playing');
      setIsPlaying(true);
      setIsPaused(false);
      setError(null);

      await serviceRef.current.playAudio(audioUrl, {
        volume: playbackOptions.volume ?? volume,
        shouldLoop: playbackOptions.shouldLoop ?? false,
      });
    } catch (err) {
      const error = err instanceof TTSError ? err : new TTSError(
        `Playback failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PLAYBACK_ERROR'
      );
      
      setError(error);
      setState('error');
      setIsPlaying(false);
      setIsPaused(false);
      onError?.(error);
    }
  }, [volume, onError]);

  // Generate and play audio in one step
  const generateAndPlay = useCallback(async (
    text: string,
    language: TTSLanguage = 'french'
  ): Promise<void> => {
    const response = await generateAudio(text, language);
    
    if (response && autoPlay) {
      await playAudio(response.audioUrl);
    }
  }, [generateAudio, playAudio, autoPlay]);

  // Stop audio playback
  const stopAudio = useCallback(async (): Promise<void> => {
    try {
      await serviceRef.current.stopAudio();
      setIsPlaying(false);
      setIsPaused(false);
      setState('idle');
    } catch (err) {
      console.warn('Error stopping audio:', err);
    }
  }, []);

  // Pause audio playback
  const pauseAudio = useCallback(async (): Promise<void> => {
    try {
      await serviceRef.current.pauseAudio();
      setIsPaused(true);
      setState('paused');
    } catch (err) {
      console.warn('Error pausing audio:', err);
    }
  }, []);

  // Resume audio playback
  const resumeAudio = useCallback(async (): Promise<void> => {
    try {
      await serviceRef.current.resumeAudio();
      setIsPaused(false);
      setState('playing');
    } catch (err) {
      console.warn('Error resuming audio:', err);
    }
  }, []);

  // Clear current error
  const clearError = useCallback((): void => {
    setError(null);
    if (state === 'error') {
      setState('idle');
    }
  }, [state]);

  // Check server status
  const checkServerStatus = useCallback(async (): Promise<boolean> => {
    try {
      const available = await serviceRef.current.isServerAvailable();
      setIsServerAvailable(available);
      return available;
    } catch {
      setIsServerAvailable(false);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      serviceRef.current.stopAudio().catch(console.warn);
    };
  }, []);

  return {
    // State
    state,
    isLoading,
    isPlaying,
    isPaused,
    error,
    currentAudio,
    isServerAvailable,
    
    // Actions
    generateAndPlay,
    generateAudio,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    clearError,
    checkServerStatus,
    
    // Utilities
    canUseFreeTTS,
    supportedLanguages,
  };
}

export default useTTS;