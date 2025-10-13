import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, AlertCircle, User, Brain } from 'lucide-react';
import { speechService, PronunciationResult } from '../lib/speech/SpeechService';
import TalkingHeadAvatar from './TalkingHeadAvatar';
import { useAI } from '../hooks/useAI';

interface PronunciationFeedback {
  accuracy: number;
  feedback: string;
  suggestions: string[];
  phonetics: string;
}

interface PronunciationPracticeProps {
  targetText: string;
  audioUrl?: string;
  language?: string;
  onResult?: (result: PronunciationResult) => void;
  className?: string;
  enableAvatar?: boolean;
  avatarLanguage?: 'fr' | 'en';
  enableAI?: boolean;
}

export const PronunciationPractice: React.FC<PronunciationPracticeProps> = ({
  targetText,
  audioUrl,
  language = 'ty-PF',
  onResult,
  className = '',
  enableAvatar = true,
  avatarLanguage = 'fr',
  enableAI = true
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [avatarText, setAvatarText] = useState<string>('');
  const [avatarMood, setAvatarMood] = useState<'neutral' | 'happy' | 'sad' | 'surprised'>('neutral');
  const [showAvatar, setShowAvatar] = useState(enableAvatar);
  const [aiAnalysis, setAiAnalysis] = useState<PronunciationFeedback | null>(null);
  const [useAIFeedback, setUseAIFeedback] = useState(enableAI);
  
  // AI service hook
  const { analyzePronunciation, isAnalyzing, analysisError } = useAI();

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
      if (enableAvatar && showAvatar) {
        // Use TalkingHead avatar for pronunciation demonstration
        setAvatarText(targetText);
        setAvatarMood('neutral');
      } else if (audioUrl) {
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
      
      // Enhanced AI analysis if enabled
      if (useAIFeedback && enableAI) {
        try {
          const aiLanguage = language.startsWith('fr') ? 'fr' : 'ty';
          const aiResult = await analyzePronunciation(
            targetText,
            pronunciationResult.transcript,
            aiLanguage
          );
          setAiAnalysis(aiResult);
          
          // Update avatar with AI feedback
          if (enableAvatar && showAvatar) {
            if (aiResult.accuracy >= 90) {
              setAvatarMood('happy');
              setAvatarText(`Excellent! ${aiResult.feedback}`);
            } else if (aiResult.accuracy >= 75) {
              setAvatarMood('neutral');
              setAvatarText(aiResult.feedback);
            } else {
              setAvatarMood('surprised');
              setAvatarText(`${aiResult.feedback} Try: ${aiResult.suggestions[0] || 'Practice slowly'}`);
            }
          }
        } catch (aiError) {
          console.warn('AI analysis failed, using basic feedback:', aiError);
          // Fallback to basic avatar feedback
          if (enableAvatar && showAvatar) {
            if (pronunciationResult.accuracy >= 90) {
              setAvatarMood('happy');
              setAvatarText('Excellent pronunciation! Très bien!');
            } else if (pronunciationResult.accuracy >= 75) {
              setAvatarMood('neutral');
              setAvatarText('Good job! Try again for better accuracy.');
            } else {
              setAvatarMood('surprised');
              setAvatarText('Let\'s practice that again. Listen carefully.');
            }
          }
        }
      } else {
        // Basic avatar feedback when AI is disabled
        if (enableAvatar && showAvatar) {
          if (pronunciationResult.accuracy >= 90) {
            setAvatarMood('happy');
            setAvatarText('Excellent pronunciation! Très bien!');
          } else if (pronunciationResult.accuracy >= 75) {
            setAvatarMood('neutral');
            setAvatarText('Good job! Try again for better accuracy.');
          } else {
            setAvatarMood('surprised');
            setAvatarText('Let\'s practice that again. Listen carefully.');
          }
        }
      }
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
    setAvatarText('');
    setAvatarMood('neutral');
    setAiAnalysis(null);
  };

  const toggleAvatar = () => {
    setShowAvatar(!showAvatar);
    if (!showAvatar) {
      setAvatarText('');
      setAvatarMood('neutral');
    }
  };

  const handleAvatarSpeechStart = () => {
    setIsPlaying(true);
  };

  const handleAvatarSpeechEnd = () => {
    setIsPlaying(false);
  };

  const handleAvatarError = (avatarError: Error) => {
    console.warn('Avatar error:', avatarError);
    setError(`Avatar: ${avatarError.message}`);
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
          <div className="flex items-center justify-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Practice Pronunciation
            </h3>
            {enableAvatar && (
              <button
                onClick={toggleAvatar}
                className={`p-2 rounded-lg transition-colors ${
                  showAvatar 
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={showAvatar ? 'Hide 3D Avatar' : 'Show 3D Avatar'}
              >
                <User className="w-4 h-4" />
              </button>
            )}
            {enableAI && (
              <button
                onClick={() => setUseAIFeedback(!useAIFeedback)}
                className={`p-2 rounded-lg transition-colors ${
                  useAIFeedback 
                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={useAIFeedback ? 'Disable AI Enhanced Feedback' : 'Enable AI Enhanced Feedback'}
              >
                <Brain className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-2xl font-medium text-blue-600 bg-blue-50 rounded-lg p-4">
            {targetText}
          </div>
        </div>

        {/* 3D Avatar */}
        {enableAvatar && showAvatar && (
          <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="text-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">3D Pronunciation Guide</h4>
            </div>
            <TalkingHeadAvatar
              text={avatarText}
              language={avatarLanguage}
              mood={avatarMood}
              onSpeechStart={handleAvatarSpeechStart}
              onSpeechEnd={handleAvatarSpeechEnd}
              onError={handleAvatarError}
              className="w-full h-64"
            />
          </div>
        )}

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

        {/* Avatar Controls */}
        {enableAvatar && showAvatar && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 font-medium">3D Avatar Active</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">Language: {avatarLanguage.toUpperCase()}</span>
                <span className="text-blue-600">•</span>
                <span className="text-blue-600">Mood: {avatarMood}</span>
              </div>
            </div>
          </div>
        )}

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
              <div className="flex items-center gap-2">
                {aiAnalysis && useAIFeedback && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                    AI Enhanced
                  </span>
                )}
                {getAccuracyIcon(aiAnalysis?.accuracy || result.accuracy)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">You said:</span>
                <p className="font-medium text-gray-900">"{result.transcript}"</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Accuracy:</span>
                <p className={`font-bold text-lg ${getAccuracyColor(aiAnalysis?.accuracy || result.accuracy)}`}>
                  {aiAnalysis?.accuracy || result.accuracy}%
                </p>
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Feedback:</span>
              <p className="font-medium text-gray-900">{aiAnalysis?.feedback || result.feedback}</p>
            </div>
            
            {(aiAnalysis?.suggestions || result.suggestions).length > 0 && (
              <div>
                <span className="text-sm text-gray-600">Suggestions:</span>
                <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1">
                  {(aiAnalysis?.suggestions || result.suggestions).map((suggestion, index) => (
                    <li key={index} className="text-sm">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {aiAnalysis && useAIFeedback && aiAnalysis.phoneticBreakdown && (
              <div>
                <span className="text-sm text-gray-600">Phonetic Analysis:</span>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                  {aiAnalysis.phoneticBreakdown}
                </p>
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
        
        {/* AI Analysis Status */}
        {isAnalyzing && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600 animate-pulse" />
              <p className="text-purple-700">AI is analyzing your pronunciation...</p>
            </div>
          </div>
        )}
        
        {analysisError && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-700">AI analysis failed. Using basic feedback.</p>
            </div>
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