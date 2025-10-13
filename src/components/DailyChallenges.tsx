'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Trophy, 
  Star, 
  Clock, 
  CheckCircle, 
  Circle, 
  Flame, 
  Target, 
  Award,
  Zap,
  Heart,
  BookOpen,
  Mic,
  Camera,
  Palette,
  Music,
  MapPin,
  Users,
  Gift,
  Crown,
  Sparkles,
  TrendingUp,
  Timer,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'language' | 'culture' | 'social' | 'creative' | 'exploration';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit?: number; // in minutes
  requirements: string[];
  rewards: {
    points: number;
    badges?: string[];
    culturalInsights?: string[];
  };
  progress: number;
  completed: boolean;
  streak?: number;
  icon: string;
  color: string;
  estimatedTime: string;
  participants?: number;
  isGroupChallenge?: boolean;
}

interface DailyChallengesProps {
  onClose?: () => void;
}

const DailyChallenges: React.FC<DailyChallengesProps> = ({ onClose }) => {
  const [currentStreak, setCurrentStreak] = useState(7);
  const [totalPoints, setTotalPoints] = useState(2450);
  const [completedToday, setCompletedToday] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const categories = [
    { id: 'all', name: 'All Challenges', icon: '🌺', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'language', name: 'Language', icon: '🗣️', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { id: 'culture', name: 'Culture', icon: '🏝️', color: 'bg-gradient-to-r from-green-500 to-teal-500' },
    { id: 'social', name: 'Social', icon: '👥', color: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { id: 'creative', name: 'Creative', icon: '🎨', color: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
    { id: 'exploration', name: 'Exploration', icon: '🗺️', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' }
  ];

  const [challenges] = useState<Challenge[]>([
    {
      id: '1',
      title: 'Morning Tahitian Greeting',
      description: 'Record yourself saying "Ia ora na" (hello) with proper pronunciation',
      category: 'language',
      difficulty: 'easy',
      points: 50,
      timeLimit: 5,
      requirements: ['Record audio', 'Proper pronunciation', 'Clear voice'],
      rewards: {
        points: 50,
        badges: ['Early Bird', 'Pronunciation Pro'],
        culturalInsights: ['Traditional Tahitian greetings and their cultural significance']
      },
      progress: 100,
      completed: true,
      streak: 7,
      icon: '🌅',
      color: 'from-orange-400 to-pink-400',
      estimatedTime: '5 min',
      participants: 234
    },
    {
      id: '2',
      title: 'Cultural Story Sharing',
      description: 'Share a traditional Tahitian legend or story with the community',
      category: 'culture',
      difficulty: 'medium',
      points: 100,
      requirements: ['Write 200+ words', 'Include cultural context', 'Add personal reflection'],
      rewards: {
        points: 100,
        badges: ['Storyteller', 'Cultural Ambassador'],
        culturalInsights: ['The oral tradition of Polynesian storytelling']
      },
      progress: 60,
      completed: false,
      icon: '📚',
      color: 'from-green-400 to-blue-400',
      estimatedTime: '15 min',
      participants: 89
    },
    {
      id: '3',
      title: 'Virtual Island Tour',
      description: 'Explore 3 different Tahitian islands using our interactive map',
      category: 'exploration',
      difficulty: 'easy',
      points: 75,
      requirements: ['Visit 3 islands', 'Read cultural information', 'Take virtual photos'],
      rewards: {
        points: 75,
        badges: ['Explorer', 'Island Hopper'],
        culturalInsights: ['Geography and cultural diversity of French Polynesia']
      },
      progress: 33,
      completed: false,
      icon: '🗺️',
      color: 'from-blue-400 to-teal-400',
      estimatedTime: '10 min',
      participants: 156
    },
    {
      id: '4',
      title: 'Tahitian Dance Moves',
      description: 'Learn and practice 3 basic Tahitian dance movements',
      category: 'creative',
      difficulty: 'medium',
      points: 120,
      timeLimit: 20,
      requirements: ['Watch tutorial', 'Practice movements', 'Record yourself'],
      rewards: {
        points: 120,
        badges: ['Dancer', 'Cultural Performer'],
        culturalInsights: ['The spiritual and cultural significance of Tahitian dance']
      },
      progress: 0,
      completed: false,
      icon: '💃',
      color: 'from-purple-400 to-pink-400',
      estimatedTime: '20 min',
      participants: 67
    },
    {
      id: '5',
      title: 'Language Partner Chat',
      description: 'Have a 10-minute conversation with a native Tahitian speaker',
      category: 'social',
      difficulty: 'hard',
      points: 200,
      timeLimit: 30,
      requirements: ['Find language partner', '10+ minute conversation', 'Use 5+ new words'],
      rewards: {
        points: 200,
        badges: ['Conversationalist', 'Social Butterfly'],
        culturalInsights: ['Modern Tahitian language usage and expressions']
      },
      progress: 0,
      completed: false,
      icon: '💬',
      color: 'from-red-400 to-orange-400',
      estimatedTime: '30 min',
      participants: 45,
      isGroupChallenge: true
    },
    {
      id: '6',
      title: 'Traditional Recipe',
      description: 'Learn about and virtually prepare a traditional Tahitian dish',
      category: 'culture',
      difficulty: 'medium',
      points: 90,
      requirements: ['Choose a recipe', 'Learn ingredients', 'Understand cultural context'],
      rewards: {
        points: 90,
        badges: ['Chef', 'Food Explorer'],
        culturalInsights: ['Traditional Tahitian cuisine and its cultural importance']
      },
      progress: 0,
      completed: false,
      icon: '🍽️',
      color: 'from-yellow-400 to-orange-400',
      estimatedTime: '12 min',
      participants: 123
    }
  ]);

  const filteredChallenges = challenges.filter(challenge => 
    selectedCategory === 'all' || challenge.category === selectedCategory
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Circle className="w-4 h-4" />;
      case 'medium': return <Target className="w-4 h-4" />;
      case 'hard': return <Crown className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const startChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    if (challenge.timeLimit) {
      setTimer(challenge.timeLimit * 60); // Convert to seconds
      setIsTimerRunning(true);
    }
  };

  const completeChallenge = (challengeId: string) => {
    // Update challenge completion logic here
    setTotalPoints(prev => prev + (challenges.find(c => c.id === challengeId)?.points || 0));
    setCompletedToday(prev => prev + 1);
    setSelectedChallenge(null);
    setTimer(null);
    setIsTimerRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer !== null && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-6xl mx-auto h-[85vh] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Daily Challenges</h1>
              <p className="text-orange-100">Embrace the Tahitian spirit every day</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Streak Counter */}
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <Flame className="w-5 h-5 text-orange-300" />
                <span className="text-2xl font-bold">{currentStreak}</span>
              </div>
              <p className="text-xs text-orange-200">Day Streak</p>
            </div>
            
            {/* Points */}
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <Star className="w-5 h-5 text-yellow-300" />
                <span className="text-2xl font-bold">{totalPoints.toLocaleString()}</span>
              </div>
              <p className="text-xs text-orange-200">Total Points</p>
            </div>
            
            {/* Completed Today */}
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span className="text-2xl font-bold">{completedToday}</span>
              </div>
              <p className="text-xs text-orange-200">Completed Today</p>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Daily Progress</span>
          <span className="text-sm text-gray-600">{completedToday}/6 challenges</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedToday / 6) * 100}%` }}
            className="bg-gradient-to-r from-orange-500 to-purple-500 h-3 rounded-full"
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-4">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedCategory === category.id
                    ? `${category.color} text-white shadow-lg`
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">This Week</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Challenges</span>
                </div>
                <span className="font-semibold text-gray-800">18/21</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600">Points</span>
                </div>
                <span className="font-semibold text-gray-800">1,240</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Badges</span>
                </div>
                <span className="font-semibold text-gray-800">5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {selectedCategory === 'all' ? 'All Challenges' : categories.find(c => c.id === selectedCategory)?.name} 
              ({filteredChallenges.length})
            </h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm">Today</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">This Week</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">All Time</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${challenge.color} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  challenge.completed ? 'ring-2 ring-green-400' : ''
                }`}
              >
                <div className="p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{challenge.icon}</div>
                      <div>
                        <h3 className="font-bold text-lg">{challenge.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs bg-white/20`}>
                            {challenge.difficulty}
                          </span>
                          {challenge.isGroupChallenge && (
                            <Users className="w-4 h-4" title="Group Challenge" />
                          )}
                        </div>
                      </div>
                    </div>
                    {challenge.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-300" />
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4" />
                        <span className="font-bold">{challenge.points}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-white/90 text-sm mb-4 line-clamp-2">{challenge.description}</p>

                  {/* Progress Bar */}
                  {!challenge.completed && challenge.progress > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{challenge.progress}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                          className="bg-white h-2 rounded-full transition-all duration-300"
                          style={{ width: `${challenge.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{challenge.estimatedTime}</span>
                      </div>
                      {challenge.participants && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{challenge.participants}</span>
                        </div>
                      )}
                    </div>
                    {challenge.streak && (
                      <div className="flex items-center space-x-1">
                        <Flame className="w-4 h-4" />
                        <span>{challenge.streak}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {challenge.completed ? (
                      <button className="flex-1 px-4 py-2 bg-white/20 text-white rounded-lg font-medium flex items-center justify-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Completed</span>
                      </button>
                    ) : challenge.progress > 0 ? (
                      <button
                        onClick={() => startChallenge(challenge)}
                        className="flex-1 px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Continue</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startChallenge(challenge)}
                        className="flex-1 px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Start</span>
                      </button>
                    )}
                    <button className="px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredChallenges.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges found</h3>
              <p className="text-gray-500">
                Try selecting a different category or check back tomorrow for new challenges
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Challenge Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className={`bg-gradient-to-r ${selectedChallenge.color} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{selectedChallenge.icon}</div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedChallenge.title}</h2>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                          {selectedChallenge.difficulty}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span className="font-bold">{selectedChallenge.points} points</span>
                        </div>
                        {timer !== null && (
                          <div className="flex items-center space-x-1">
                            <Timer className="w-4 h-4" />
                            <span className="font-bold">{formatTime(timer)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedChallenge(null);
                      setTimer(null);
                      setIsTimerRunning(false);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-600">{selectedChallenge.description}</p>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Requirements</h3>
                  <ul className="space-y-2">
                    {selectedChallenge.requirements.map((req, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <Circle className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Rewards</h3>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">{selectedChallenge.rewards.points} Points</span>
                    </div>
                    {selectedChallenge.rewards.badges && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="w-5 h-5 text-purple-500" />
                        <span className="text-sm text-gray-600">
                          Badges: {selectedChallenge.rewards.badges.join(', ')}
                        </span>
                      </div>
                    )}
                    {selectedChallenge.rewards.culturalInsights && (
                      <div className="flex items-start space-x-2">
                        <BookOpen className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600 font-medium mb-1">Cultural Insights:</p>
                          {selectedChallenge.rewards.culturalInsights.map((insight, index) => (
                            <p key={index} className="text-sm text-gray-600">{insight}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  {timer !== null && (
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                    >
                      {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isTimerRunning ? 'Pause' : 'Resume'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => completeChallenge(selectedChallenge.id)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Challenge</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DailyChallenges;
export { DailyChallenges };