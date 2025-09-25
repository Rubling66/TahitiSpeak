// TTS Configuration and API Types for Coqui TTS Integration

export interface TTSConfig {
  baseUrl: string;
  models: {
    english: string;
    french: string;
  };
  timeout?: number;
  retryAttempts?: number;
  defaultSpeakerId?: string;
  defaultLanguageId?: string;
  headers?: Record<string, string>;
}

export interface TTSRequest {
  text: string;
  model: string;
  speaker_id?: string;
  language_id?: string;
  speed?: number;
  voice?: string;
}

export interface TTSResponse {
  success: boolean;
  audioUrl: string;
  text: string;
  language: TTSLanguage;
  model: string;
  duration: number;
  error?: string;
}

export class TTSError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'TTSError';
    this.code = code;
    this.details = details;
  }
}

export type TTSState = 'idle' | 'generating' | 'playing' | 'paused' | 'error';

export interface TTSHookState {
  isLoading: boolean;
  isPlaying: boolean;
  error: TTSError | null;
  audioUrl: string | null;
  currentText: string | null;
}

export type TTSLanguage = 'english' | 'french';

export type TTSModel = {
  id: string;
  name: string;
  language: TTSLanguage;
  description?: string;
};

export interface AudioPlaybackOptions {
  autoPlay?: boolean;
  volume?: number;
  shouldLoop?: boolean;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

// Free TTS Configuration as provided
export const FREE_TTS_CONFIG: TTSConfig = {
  baseUrl: 'http://localhost:5002',
  models: {
    english: 'tts_models/en/ljspeech/tacotron2-DDC',
    french: 'tts_models/fr/mai/tacotron2-DDC'
  },
  timeout: 30000,
  retryAttempts: 3,
  defaultSpeakerId: '0',
  defaultLanguageId: '0',
  headers: {}
};

// Available TTS Models
export const TTS_MODELS: Record<TTSLanguage, string> = {
  english: 'tts_models/en/ljspeech/tacotron2-DDC',
  french: 'tts_models/fr/mai/tacotron2-DDC'
};

export const TTS_MODEL_LIST: TTSModel[] = [
  {
    id: 'tts_models/en/ljspeech/tacotron2-DDC',
    name: 'English (LJSpeech)',
    language: 'english',
    description: 'High-quality English TTS model'
  },
  {
    id: 'tts_models/fr/mai/tacotron2-DDC',
    name: 'French (MAI)',
    language: 'french',
    description: 'High-quality French TTS model'
  }
];