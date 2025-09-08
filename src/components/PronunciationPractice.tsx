import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { speechService, PronunciationResult } from '../lib/speech/SpeechService';

interface PronunciationPracticeProps {
  targetText: string;
  audioUrl?: string;
  language?: string;
  onResult?: (result: PronunciationResult) => void;
  className?: string;
}

export const PronunciationPractice: React.FC<PronunciationPracticeProps> = ({
  targetText,
  audioUrl,
  language = 'ty-PF',
  onResult,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if speech recognition is supported
    setIsSupported(speechService.isRecognitionSupported());
    
    // Check microphone permission on mount
    checkMicrophonePermission();
    
    return () => {
      speechService.cleanup();
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const permission = await speechService.requestMicrophonePermission();
      setHasPermission(permission);
    } catch (error) {
      setHasPermission(false);
    }
  };

  const playAudio = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setError(null);
    
    try {
      if (audioUrl) {
        // Play audio file
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          setError('Failed to play audio');
        };
        await audio.play();
      } else {
        // Use text-to-speech
        await speechService.speak(targetText, { lang: language });
        setIsPlaying(false);
      }
    } catch (error) {
      setIsPlaying(false);
      setError('Failed to play audio');
      console.error('Audio playback error:', error);
    }
  };

  const startListening = async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }
    
    if (!hasPermission) {
      const permission = await speechService.requestMicrophonePermission();
      if (!permission) {
        setError('Microphone permission is required for pronunciation practice');
        return;
      }
      setHasPermission(true);
    }
    
    setIsListening(true);
    setError(null);
    setResult(null);
    
    try {
      const pronunciationResult = await speechService.startListening(targetText, {
        language,
        continuous: false,
        interimResults: false
      });
      
      setResult(pronunciationResult);
      onResult?.(pronunciationResult);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Speech recognition failed');
      console.error('Speech recognition error:', error);
    } finally {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  const resetPractice = () => {
    setResult(null);
    setError(null);
    speechService.stopListening();
    speechService.stopSpeaking();
    setIsListening(false);
    setIsPlaying(false);
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 75) return 'text-yellow-600';
    if (accuracy >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 75) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <AlertCircle className="w-5 h-5 text-orange-600" />;
  };

  if (!isSupported) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <AlertCircle className="w-5 h-5" />
          <span>Speech recognition is not supported in this browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="space-y-4">
        {/* Target Text */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Practice Pronunciation
          </h3>
          <div className="text-2xl font-medium text-blue-600 bg-blue-50 rounded-lg p-4">
            {targetText}
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={playAudio}
            disabled={isPlaying || isListening}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
            {isPlaying ? 'Playing...' : 'Listen'}
          </button>

          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isPlaying || (hasPermission === false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5 animate-pulse" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Record
              </>
            )}
          </button>

          <button
            onClick={resetPractice}
            disabled={isListening || isPlaying}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {/* Permission Warning */}
        {hasPermission === false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Microphone Access Required</span>
            </div>
            <p className="text-yellow-700 mt-1">
              Please allow microphone access to practice pronunciation.
            </p>
          </div>
        )}

        {/* Listening Indicator */}
        {isListening && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <Mic className="w-5 h-5 animate-pulse" />
              <span className="font-medium">Listening... Speak now!</span>
            </div>
            <p className="text-green-700 mt-1">
              Say: "{targetText}"
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Pronunciation Result</h4>
              {getAccuracyIcon(result.accuracy)}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">You said:</span>
                <p className="font-medium text-gray-900">"{result.transcript}"</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Accuracy:</span>
                <p className={`font-bold text-lg ${getAccuracyColor(result.accuracy)}`}>
                  {result.accuracy}%
                </p>
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Feedback:</span>
              <p className="font-medium text-gray-900">{result.feedback}</p>
            </div>
            
            {result.suggestions.length > 0 && (
              <div>
                <span className="text-sm text-gray-600">Suggestions:</span>
                <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.confidence > 0 && (
              <div>
                <span className="text-sm text-gray-600">Confidence:</span>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${result.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600">
          <p>Click "Listen" to hear the pronunciation, then "Record" to practice.</p>
        </div>
      </div>
    </div>
  );
};

export default PronunciationPractice;