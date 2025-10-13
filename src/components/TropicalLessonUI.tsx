'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  BookOpen, 
  Mic, 
  Volume2, 
  Bot, 
  PlayCircle, 
  Star,
  Trophy,
  Heart,
  Headphones,
  MessageCircle
} from 'lucide-react';
import { aiCulturalService } from '../services/aiCulturalService';

// Sample vocabulary data
const vocabulary = [
  { tahitian: 'Ia Orana', english: 'Hello/Good morning', pronunciation: '/ia o-RA-na/' },
  { tahitian: 'Nana', english: 'Goodbye', pronunciation: '/NA-na/' },
  { tahitian: 'Mauruuru', english: 'Thank you', pronunciation: '/mau-RU-ru/' },
  { tahitian: 'E aha te huru?', english: 'How are you?', pronunciation: '/e A-ha te HU-ru/' },
  { tahitian: 'Maita\'i', english: 'Good/Fine', pronunciation: '/mai-TA-i/' },
  { tahitian: 'Aita pe\'ape\'a', english: 'No problem', pronunciation: '/AI-ta pe-A-pe-A/' }
];

interface TropicalLessonUIProps {
  lessonTitle?: string;
  lessonDescription?: string;
  progress?: number;
  userLevel?: string;
}

export const TropicalLessonUI: React.FC<TropicalLessonUIProps> = ({
  lessonTitle = "Basic Greetings",
  lessonDescription = "Learn to connect with the warm greetings of Tahiti",
  progress = 65,
  userLevel = "Island Explorer"
}) => {
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [culturalTip, setCulturalTip] = useState<string>('');
  const [showCulturalContext, setShowCulturalContext] = useState(false);

  const handlePlayAudio = (index: number) => {
    setPlayingAudio(index);
    
    // Get cultural context for the word
    const word = vocabulary[index];
    const response = aiCulturalService.generateCulturalResponse(
      `Tell me about the cultural significance of "${word.tahitian}"`
    );
    setCulturalTip(response.culturalNote || response.message);
    
    // Simulate audio playing
    setTimeout(() => {
      setPlayingAudio(null);
      setCompletedWords(prev => new Set([...prev, index]));
    }, 2000);
  };

  const handlePronunciationPractice = () => {
    // Enhanced pronunciation practice with cultural context
    const response = aiCulturalService.generateCulturalResponse(
      'Give me pronunciation tips for Tahitian greetings'
    );
    setCulturalTip(response.message);
    setShowCulturalContext(true);
    console.log('Starting pronunciation practice with cultural context...');
  };

  const handleCulturalQuestion = (word: any) => {
    const response = aiCulturalService.generateCulturalResponse(
      `What is the cultural meaning behind "${word.tahitian}"?`
    );
    setCulturalTip(response.message);
    setShowCulturalContext(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tropical-sand to-tropical-plumeria">
      {/* Lesson Header with Island Background */}
      <header className="relative h-64 bg-gradient-to-r from-tropical-ocean to-tropical-lagoon overflow-hidden">
        {/* Background Image Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-80">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>
        
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="relative z-10 container mx-auto px-6 h-full flex items-center">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-tropical-coral rounded-full flex items-center justify-center animate-float">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-tropical-heading text-3xl text-white">
                {lessonTitle}
              </h1>
            </div>
            <p className="text-tropical-sand text-lg">
              {lessonDescription}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="text-white text-sm">Lesson 1 of 12</span>
            </div>
          </div>
        </div>
      </header>

      {/* Cultural Context Banner */}
      {showCulturalContext && culturalTip && (
        <div className="container mx-auto px-6 -mt-6 relative z-30">
          <div className="bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white p-4 rounded-2xl shadow-xl border-2 border-white/20 animate-slide-down">
            <div className="flex items-start gap-3">
              <Bot className="w-6 h-6 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Cultural Insight</h3>
                <p className="text-sm leading-relaxed">{culturalTip}</p>
              </div>
              <button 
                onClick={() => setShowCulturalContext(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Content with Tropical Cards */}
      <div className="container mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Vocabulary Cards */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-tropical-lagoon/20 tropical-card">
              <h2 className="font-tropical-heading text-2xl text-tropical-ocean mb-6 flex items-center gap-3">
                <Mic className="w-6 h-6 text-tropical-coral" />
                Practice These Phrases
              </h2>
              
              <div className="space-y-4">
                {vocabulary.map((word, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                      completedWords.has(index) 
                        ? 'bg-green-50 border-2 border-green-200' 
                        : 'bg-tropical-sand/30 hover:bg-tropical-lagoon/10'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-tropical-heading text-xl text-tropical-ocean flex items-center gap-2">
                        {word.tahitian}
                        {completedWords.has(index) && (
                          <Trophy className="w-5 h-5 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="text-tropical-ocean/70 text-sm">
                        {word.english}
                      </div>
                      <div className="text-tropical-coral text-xs mt-1 font-mono">
                        {word.pronunciation}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Cultural Context Button */}
                      <button 
                        onClick={() => handleCulturalQuestion(word)}
                        className="transition-all duration-300 p-2 rounded-full bg-tropical-lagoon/20 hover:bg-tropical-lagoon/30 text-tropical-ocean opacity-0 group-hover:opacity-100"
                        title="Learn cultural context"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => handlePlayAudio(index)}
                        disabled={playingAudio === index}
                        className={`transition-all duration-300 p-3 rounded-full transform hover:scale-110 ${
                          playingAudio === index
                            ? 'bg-tropical-sunset text-white animate-pulse'
                            : completedWords.has(index)
                            ? 'bg-green-500 text-white'
                            : 'bg-tropical-coral text-white hover:bg-tropical-sunset opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {playingAudio === index ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Practice All Button */}
              <div className="mt-8 text-center">
                <button 
                  onClick={handlePronunciationPractice}
                  className="bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-3 mx-auto"
                >
                  <Headphones className="w-6 h-6" />
                  Practice All Pronunciations
                </button>
              </div>
            </div>
          </div>

          {/* Right: AI Tutor & Progress */}
          <div className="space-y-8">
            {/* Enhanced AI Tutor Card */}
            <div className="bg-gradient-to-br from-tropical-lagoon to-tropical-ocean rounded-3xl p-6 text-white shadow-2xl tropical-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center animate-float-delayed">
                  <Bot className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tropical-heading text-xl">Your Cultural Guide</h3>
                  <p className="text-white/80 text-sm">AI-powered cultural companion</p>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-2xl p-4 mb-4">
                <p className="text-sm">
                  "Try saying 'Ia Orana' with a smile - it means more than just hello! 
                  In Tahitian culture, greetings carry the warmth of the islands and wish life to others."
                </p>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handlePronunciationPractice}
                  className="w-full bg-white text-tropical-ocean py-3 rounded-xl font-semibold hover:bg-tropical-sand transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  Practice Pronunciation
                </button>
                
                <button 
                  onClick={() => {
                    const response = aiCulturalService.generateCulturalResponse('Tell me about Tahitian greeting customs');
                    setCulturalTip(response.message);
                    setShowCulturalContext(true);
                  }}
                  className="w-full bg-white/20 text-white py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Cultural Context
                </button>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-tropical-coral/20 tropical-card">
              <h3 className="font-tropical-heading text-xl text-tropical-ocean mb-4 flex items-center gap-2">
                <Heart className="w-6 h-6 text-tropical-coral" />
                Your Journey
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-tropical-ocean/70">
                  <span>{userLevel}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-tropical-sand rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-tropical-coral to-tropical-sunset h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Achievement Badges */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-tropical-ocean mb-3">Recent Achievements</h4>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-600 fill-current" />
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-green-600 fill-current" />
                    </div>
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-pink-600 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Next Milestone */}
                <div className="mt-4 p-3 bg-tropical-lagoon/10 rounded-xl">
                  <div className="text-xs text-tropical-ocean/60 mb-1">Next Milestone</div>
                  <div className="text-sm font-semibold text-tropical-ocean">Cultural Conversations</div>
                  <div className="text-xs text-tropical-coral">35% to unlock</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-tropical-palm/20 tropical-card">
              <h3 className="font-tropical-heading text-lg text-tropical-ocean mb-4">Today's Progress</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-tropical-coral">{completedWords.size}</div>
                  <div className="text-xs text-tropical-ocean/60">Words Practiced</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-tropical-lagoon">12</div>
                  <div className="text-xs text-tropical-ocean/60">Minutes Studied</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TropicalLessonUI;