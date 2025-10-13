'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Target, 
  Trophy, 
  Star, 
  Clock, 
  Calendar, 
  MapPin, 
  Crown, 
  Award, 
  Zap,
  Heart,
  BookOpen,
  Music,
  Palette,
  Camera,
  Mic,
  Globe,
  Compass,
  Flame,
  Gift,
  Sparkles,
  CheckCircle,
  Circle,
  Play,
  Pause,
  RotateCcw,
  UserPlus,
  MessageCircle,
  Share2,
  Eye,
  TrendingUp,
  Flag,
  Shield,
  Sword,
  Mountain,
  Waves,
  Sun,
  Moon
} from 'lucide-react';

interface QuestMember {
  id: string;
  name: string;
  avatar: string;
  role: 'leader' | 'member' | 'contributor';
  contribution: number;
  joinedAt: Date;
  isOnline: boolean;
}

interface QuestReward {
  type: 'points' | 'badge' | 'title' | 'cultural_insight' | 'special_access';
  value: string | number;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface QuestObjective {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'collective' | 'milestone';
  target: number;
  current: number;
  completed: boolean;
  icon: string;
}

interface CollaborativeQuest {
  id: string;
  title: string;
  description: string;
  category: 'cultural' | 'language' | 'social' | 'creative' | 'exploration' | 'seasonal';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  duration: number; // in days
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  currentParticipants: number;
  members: QuestMember[];
  objectives: QuestObjective[];
  rewards: QuestReward[];
  progress: number;
  status: 'upcoming' | 'active' | 'completed' | 'failed';
  requirements: string[];
  culturalContext: string;
  icon: string;
  color: string;
  isJoined: boolean;
  isFeatured?: boolean;
  seasonalEvent?: string;
}

interface CollaborativeQuestsProps {
  onClose?: () => void;
}

const CollaborativeQuests: React.FC<CollaborativeQuestsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'completed' | 'seasonal'>('active');
  const [selectedQuest, setSelectedQuest] = useState<CollaborativeQuest | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Quests', icon: '🌺' },
    { id: 'cultural', name: 'Cultural Heritage', icon: '🏝️' },
    { id: 'language', name: 'Language Mastery', icon: '🗣️' },
    { id: 'social', name: 'Community Building', icon: '👥' },
    { id: 'creative', name: 'Creative Arts', icon: '🎨' },
    { id: 'exploration', name: 'Island Discovery', icon: '🗺️' },
    { id: 'seasonal', name: 'Seasonal Events', icon: '🎭' }
  ];

  const difficulties = [
    { id: 'all', name: 'All Levels', color: 'gray' },
    { id: 'easy', name: 'Beginner', color: 'green' },
    { id: 'medium', name: 'Intermediate', color: 'yellow' },
    { id: 'hard', name: 'Advanced', color: 'red' },
    { id: 'legendary', name: 'Legendary', color: 'purple' }
  ];

  const [quests] = useState<CollaborativeQuest[]>([
    {
      id: '1',
      title: 'Tahitian Storytelling Circle',
      description: 'Collaborate to collect and share 50 traditional Tahitian legends and stories from different islands',
      category: 'cultural',
      difficulty: 'medium',
      duration: 14,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-29'),
      maxParticipants: 25,
      currentParticipants: 18,
      members: [
        {
          id: '1',
          name: 'Teiva Raapoto',
          avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20elder%20storyteller%20traditional%20setting&image_size=square',
          role: 'leader',
          contribution: 85,
          joinedAt: new Date('2024-01-15'),
          isOnline: true
        },
        {
          id: '2',
          name: 'Marie Tauira',
          avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20woman%20cultural%20keeper&image_size=square',
          role: 'contributor',
          contribution: 72,
          joinedAt: new Date('2024-01-16'),
          isOnline: false
        }
      ],
      objectives: [
        {
          id: 'obj1',
          title: 'Collect Traditional Stories',
          description: 'Gather stories from elders and cultural keepers',
          type: 'collective',
          target: 50,
          current: 32,
          completed: false,
          icon: '📚'
        },
        {
          id: 'obj2',
          title: 'Audio Recordings',
          description: 'Record stories in original Tahitian language',
          type: 'collective',
          target: 25,
          current: 18,
          completed: false,
          icon: '🎤'
        },
        {
          id: 'obj3',
          title: 'Cultural Context',
          description: 'Provide historical and cultural background for each story',
          type: 'collective',
          target: 50,
          current: 28,
          completed: false,
          icon: '🏛️'
        }
      ],
      rewards: [
        {
          type: 'points',
          value: 500,
          description: 'Storytelling Master Points',
          rarity: 'rare'
        },
        {
          type: 'badge',
          value: 'Cultural Keeper',
          description: 'Guardian of Tahitian Heritage',
          rarity: 'epic'
        },
        {
          type: 'title',
          value: 'Master Storyteller',
          description: 'Recognized keeper of oral traditions',
          rarity: 'legendary'
        }
      ],
      progress: 64,
      status: 'active',
      requirements: ['Basic Tahitian knowledge', 'Respect for cultural traditions', 'Commitment to authenticity'],
      culturalContext: 'Oral storytelling is the heart of Polynesian culture, preserving history, values, and wisdom across generations.',
      icon: '📖',
      color: 'from-blue-500 to-teal-500',
      isJoined: true
    },
    {
      id: '2',
      title: 'Polynesian Dance Festival',
      description: 'Learn and perform traditional dances from across French Polynesia in a virtual celebration',
      category: 'creative',
      difficulty: 'hard',
      duration: 21,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-22'),
      maxParticipants: 40,
      currentParticipants: 35,
      members: [],
      objectives: [
        {
          id: 'obj1',
          title: 'Learn Traditional Dances',
          description: 'Master 5 different Polynesian dance styles',
          type: 'individual',
          target: 5,
          current: 0,
          completed: false,
          icon: '💃'
        },
        {
          id: 'obj2',
          title: 'Group Performances',
          description: 'Participate in synchronized group performances',
          type: 'collective',
          target: 10,
          current: 0,
          completed: false,
          icon: '🎭'
        }
      ],
      rewards: [
        {
          type: 'points',
          value: 750,
          description: 'Dance Master Points',
          rarity: 'epic'
        },
        {
          type: 'badge',
          value: 'Dance Virtuoso',
          description: 'Master of Polynesian Movement',
          rarity: 'legendary'
        }
      ],
      progress: 0,
      status: 'upcoming',
      requirements: ['Physical activity capability', 'Video recording ability', 'Cultural sensitivity'],
      culturalContext: 'Dance is the soul of Polynesian expression, telling stories of gods, nature, and human experience.',
      icon: '💃',
      color: 'from-purple-500 to-pink-500',
      isJoined: false,
      isFeatured: true
    },
    {
      id: '3',
      title: 'Island Hopping Adventure',
      description: 'Virtually explore all 118 islands of French Polynesia and document unique cultural features',
      category: 'exploration',
      difficulty: 'easy',
      duration: 30,
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-02-09'),
      maxParticipants: 100,
      currentParticipants: 67,
      members: [],
      objectives: [
        {
          id: 'obj1',
          title: 'Visit Islands',
          description: 'Explore virtual tours of different island groups',
          type: 'collective',
          target: 118,
          current: 89,
          completed: false,
          icon: '🏝️'
        },
        {
          id: 'obj2',
          title: 'Cultural Documentation',
          description: 'Document unique features of each island',
          type: 'collective',
          target: 118,
          current: 76,
          completed: false,
          icon: '📝'
        }
      ],
      rewards: [
        {
          type: 'points',
          value: 300,
          description: 'Explorer Points',
          rarity: 'common'
        },
        {
          type: 'badge',
          value: 'Island Explorer',
          description: 'Navigator of Polynesian Waters',
          rarity: 'rare'
        }
      ],
      progress: 75,
      status: 'active',
      requirements: ['Curiosity about geography', 'Attention to detail'],
      culturalContext: 'Each island in French Polynesia has its own unique character, history, and cultural traditions.',
      icon: '🗺️',
      color: 'from-green-500 to-blue-500',
      isJoined: true
    },
    {
      id: '4',
      title: 'Heiva Festival Celebration',
      description: 'Participate in a virtual recreation of the annual Heiva festival with competitions and performances',
      category: 'seasonal',
      difficulty: 'legendary',
      duration: 7,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-07'),
      maxParticipants: 200,
      currentParticipants: 156,
      members: [],
      objectives: [
        {
          id: 'obj1',
          title: 'Competition Participation',
          description: 'Participate in traditional competitions',
          type: 'individual',
          target: 3,
          current: 0,
          completed: false,
          icon: '🏆'
        }
      ],
      rewards: [
        {
          type: 'points',
          value: 1000,
          description: 'Festival Champion Points',
          rarity: 'legendary'
        },
        {
          type: 'title',
          value: 'Heiva Champion',
          description: 'Master of Festival Arts',
          rarity: 'legendary'
        }
      ],
      progress: 0,
      status: 'upcoming',
      requirements: ['Advanced cultural knowledge', 'Performance skills', 'Competitive spirit'],
      culturalContext: 'Heiva is the most important cultural festival in Tahiti, celebrating Polynesian arts, music, and dance.',
      icon: '🎭',
      color: 'from-yellow-500 to-red-500',
      isJoined: false,
      isFeatured: true,
      seasonalEvent: 'Heiva Festival 2024'
    }
  ]);

  const activeQuests = quests.filter(q => q.status === 'active' && q.isJoined);
  const availableQuests = quests.filter(q => q.status === 'upcoming' || (q.status === 'active' && !q.isJoined));
  const completedQuests = quests.filter(q => q.status === 'completed');
  const seasonalQuests = quests.filter(q => q.category === 'seasonal');

  const getCurrentQuests = () => {
    switch (activeTab) {
      case 'active': return activeQuests;
      case 'available': return availableQuests;
      case 'completed': return completedQuests;
      case 'seasonal': return seasonalQuests;
      default: return [];
    }
  };

  const filteredQuests = getCurrentQuests().filter(quest => {
    const matchesCategory = filterCategory === 'all' || quest.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || quest.difficulty === filterDifficulty;
    return matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      case 'legendary': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Ending soon';
  };

  const joinQuest = (questId: string) => {
    // Join quest logic here
    console.log('Joining quest:', questId);
  };

  const leaveQuest = (questId: string) => {
    // Leave quest logic here
    console.log('Leaving quest:', questId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-7xl mx-auto h-[85vh] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Collaborative Quests</h1>
              <p className="text-purple-100">Unite with fellow learners on epic cultural journeys</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-xl font-bold">{activeQuests.length}</span>
              </div>
              <p className="text-xs text-purple-200">Active Quests</p>
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

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'active', label: 'Active Quests', icon: Play, count: activeQuests.length },
            { id: 'available', label: 'Available', icon: Compass, count: availableQuests.length },
            { id: 'completed', label: 'Completed', icon: Trophy, count: completedQuests.length },
            { id: 'seasonal', label: 'Seasonal Events', icon: Sparkles, count: seasonalQuests.length }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id}>
                    {difficulty.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Featured Quest */}
          {availableQuests.find(q => q.isFeatured) && (
            <div className="mb-6 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h4 className="font-semibold text-gray-800">Featured Quest</h4>
              </div>
              {(() => {
                const featured = availableQuests.find(q => q.isFeatured);
                return featured ? (
                  <div>
                    <p className="text-sm font-medium text-gray-800">{featured.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{featured.seasonalEvent}</p>
                    <button
                      onClick={() => setSelectedQuest(featured)}
                      className="mt-2 w-full px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors"
                    >
                      Learn More
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Quest Stats */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Your Progress</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600">Quests Completed</span>
                </div>
                <span className="font-semibold text-gray-800">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Legendary Quests</span>
                </div>
                <span className="font-semibold text-gray-800">2</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Team Contributions</span>
                </div>
                <span className="font-semibold text-gray-800">847</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-600">Leadership Roles</span>
                </div>
                <span className="font-semibold text-gray-800">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {activeTab === 'active' && 'Your Active Quests'}
              {activeTab === 'available' && 'Available Quests'}
              {activeTab === 'completed' && 'Completed Quests'}
              {activeTab === 'seasonal' && 'Seasonal Events'}
              ({filteredQuests.length})
            </h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-purple-100 text-purple-600 rounded text-sm">Trending</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">New</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">Ending Soon</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuests.map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${quest.color} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  quest.isFeatured ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className="p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{quest.icon}</div>
                      <div>
                        <h3 className="font-bold text-lg">{quest.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs bg-white/20`}>
                            {quest.difficulty}
                          </span>
                          <span className="text-xs opacity-90 capitalize">{quest.category}</span>
                          {quest.isFeatured && (
                            <Star className="w-4 h-4 text-yellow-300" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{quest.currentParticipants}/{quest.maxParticipants}</span>
                      </div>
                      {quest.status === 'active' && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">{formatTimeRemaining(quest.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-white/90 text-sm mb-4 line-clamp-2">{quest.description}</p>

                  {/* Progress Bar */}
                  {quest.status === 'active' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Quest Progress</span>
                        <span>{quest.progress}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                          className="bg-white h-2 rounded-full transition-all duration-300"
                          style={{ width: `${quest.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Objectives Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Objectives ({quest.objectives.filter(o => o.completed).length}/{quest.objectives.length})</h4>
                    <div className="space-y-1">
                      {quest.objectives.slice(0, 2).map((objective) => (
                        <div key={objective.id} className="flex items-center space-x-2 text-xs">
                          {objective.completed ? (
                            <CheckCircle className="w-3 h-3 text-green-300" />
                          ) : (
                            <Circle className="w-3 h-3 text-white/60" />
                          )}
                          <span className="flex-1 truncate">{objective.title}</span>
                          <span className="text-white/80">{objective.current}/{objective.target}</span>
                        </div>
                      ))}
                      {quest.objectives.length > 2 && (
                        <p className="text-xs text-white/70">+{quest.objectives.length - 2} more objectives</p>
                      )}
                    </div>
                  </div>

                  {/* Members Preview */}
                  {quest.members.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium">Team Members</h4>
                        <div className="flex -space-x-2">
                          {quest.members.slice(0, 4).map((member) => (
                            <img
                              key={member.id}
                              src={member.avatar}
                              alt={member.name}
                              className="w-6 h-6 rounded-full border-2 border-white"
                            />
                          ))}
                          {quest.members.length > 4 && (
                            <div className="w-6 h-6 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-xs">
                              +{quest.members.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rewards Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Rewards</h4>
                    <div className="flex flex-wrap gap-1">
                      {quest.rewards.slice(0, 3).map((reward, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded text-xs bg-white/20 flex items-center space-x-1`}
                        >
                          {reward.type === 'points' && <Star className="w-3 h-3" />}
                          {reward.type === 'badge' && <Award className="w-3 h-3" />}
                          {reward.type === 'title' && <Crown className="w-3 h-3" />}
                          <span>{reward.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    {quest.isJoined ? (
                      <>
                        <button
                          onClick={() => setSelectedQuest(quest)}
                          className="flex-1 px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Progress</span>
                        </button>
                        <button
                          onClick={() => leaveQuest(quest.id)}
                          className="px-3 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors"
                        >
                          Leave
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedQuest(quest)}
                          className="flex-1 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => joinQuest(quest.id)}
                          disabled={quest.currentParticipants >= quest.maxParticipants}
                          className="flex-1 px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Join Quest</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredQuests.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quests found</h3>
              <p className="text-gray-500">
                {activeTab === 'active' && "You haven't joined any quests yet. Check out available quests to get started!"}
                {activeTab === 'available' && "No quests match your current filters. Try adjusting your search criteria."}
                {activeTab === 'completed' && "You haven't completed any quests yet. Join some active quests to start your journey!"}
                {activeTab === 'seasonal' && "No seasonal events are currently available. Check back during festival seasons!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quest Detail Modal */}
      <AnimatePresence>
        {selectedQuest && (
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
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className={`bg-gradient-to-r ${selectedQuest.color} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{selectedQuest.icon}</div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedQuest.title}</h2>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                          {selectedQuest.difficulty}
                        </span>
                        <span className="text-sm opacity-90 capitalize">{selectedQuest.category}</span>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{selectedQuest.currentParticipants}/{selectedQuest.maxParticipants} participants</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedQuest(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Quest Description</h3>
                      <p className="text-gray-600">{selectedQuest.description}</p>
                    </div>

                    {/* Cultural Context */}
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Cultural Context</h3>
                      <p className="text-gray-600">{selectedQuest.culturalContext}</p>
                    </div>

                    {/* Requirements */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Requirements</h3>
                      <ul className="space-y-2">
                        {selectedQuest.requirements.map((req, index) => (
                          <li key={index} className="flex items-center space-x-3">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-gray-600">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Rewards */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Rewards</h3>
                      <div className="space-y-3">
                        {selectedQuest.rewards.map((reward, index) => (
                          <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              {reward.type === 'points' && <Star className="w-5 h-5 text-yellow-500" />}
                              {reward.type === 'badge' && <Award className="w-5 h-5 text-purple-500" />}
                              {reward.type === 'title' && <Crown className="w-5 h-5 text-orange-500" />}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{reward.value}</span>
                                  <span className={`px-2 py-1 rounded text-xs ${getRarityColor(reward.rarity)}`}>
                                    {reward.rarity}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{reward.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Objectives */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Quest Objectives</h3>
                      <div className="space-y-3">
                        {selectedQuest.objectives.map((objective) => (
                          <div key={objective.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <div className="text-2xl">{objective.icon}</div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium">{objective.title}</h4>
                                  {objective.completed && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{objective.description}</p>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500 capitalize">{objective.type} objective</span>
                                  <span className="font-medium">{objective.current}/{objective.target}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(objective.current / objective.target) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team Members */}
                    {selectedQuest.members.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Team Members</h3>
                        <div className="space-y-2">
                          {selectedQuest.members.map((member) => (
                            <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="relative">
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full"
                                />
                                {member.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{member.name}</span>
                                  {member.role === 'leader' && (
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span>Contribution: {member.contribution}%</span>
                                  <span>•</span>
                                  <span className="capitalize">{member.role}</span>
                                </div>
                              </div>
                              <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                  {selectedQuest.isJoined ? (
                    <>
                      <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                        <Play className="w-4 h-4" />
                        <span>Continue Quest</span>
                      </button>
                      <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => leaveQuest(selectedQuest.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Leave Quest
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => joinQuest(selectedQuest.id)}
                        disabled={selectedQuest.currentParticipants >= selectedQuest.maxParticipants}
                        className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Join Quest</span>
                      </button>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CollaborativeQuests;
export { CollaborativeQuests };