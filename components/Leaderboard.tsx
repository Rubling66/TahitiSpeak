'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Crown, 
  Star, 
  Medal, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  Calendar,
  Filter,
  Search,
  Flame,
  Target,
  BookOpen,
  MessageCircle,
  Heart,
  Zap,
  Globe,
  MapPin,
  Clock,
  ChevronUp,
  ChevronDown,
  Eye,
  UserPlus,
  Gift,
  Sparkles
} from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  rank: number;
  previousRank?: number;
  points: number;
  level: number;
  streak: number;
  badges: string[];
  culturalAchievements: {
    languageProficiency: number;
    culturalKnowledge: number;
    socialEngagement: number;
    creativityScore: number;
  };
  location: string;
  joinedDate: Date;
  lastActive: Date;
  specialTitles: string[];
  weeklyProgress: number;
  monthlyProgress: number;
  isOnline: boolean;
  isFriend?: boolean;
}

interface LeaderboardProps {
  onClose?: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('weekly');
  const [category, setCategory] = useState<'overall' | 'language' | 'culture' | 'social' | 'creative'>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const timeframes = [
    { id: 'daily', name: 'Today', icon: '📅' },
    { id: 'weekly', name: 'This Week', icon: '📊' },
    { id: 'monthly', name: 'This Month', icon: '🗓️' },
    { id: 'all-time', name: 'All Time', icon: '🏆' }
  ];

  const categories = [
    { id: 'overall', name: 'Overall', icon: '🌺', color: 'from-purple-500 to-pink-500' },
    { id: 'language', name: 'Language', icon: '🗣️', color: 'from-blue-500 to-cyan-500' },
    { id: 'culture', name: 'Culture', icon: '🏝️', color: 'from-green-500 to-teal-500' },
    { id: 'social', name: 'Social', icon: '👥', color: 'from-orange-500 to-red-500' },
    { id: 'creative', name: 'Creative', icon: '🎨', color: 'from-purple-500 to-indigo-500' }
  ];

  const [leaderboardData] = useState<LeaderboardUser[]>([
    {
      id: '1',
      name: 'Teiva Raapoto',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20man%20smiling%20portrait%20tropical%20background&image_size=square',
      rank: 1,
      previousRank: 2,
      points: 15420,
      level: 28,
      streak: 45,
      badges: ['Cultural Master', 'Language Expert', 'Community Leader', 'Streak Champion'],
      culturalAchievements: {
        languageProficiency: 95,
        culturalKnowledge: 92,
        socialEngagement: 88,
        creativityScore: 85
      },
      location: 'Tahiti, French Polynesia',
      joinedDate: new Date('2023-01-15'),
      lastActive: new Date(),
      specialTitles: ['Tahitian Ambassador', 'Master Storyteller'],
      weeklyProgress: 1240,
      monthlyProgress: 4850,
      isOnline: true,
      isFriend: false
    },
    {
      id: '2',
      name: 'Marie Tauira',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20woman%20smiling%20portrait%20tropical%20flowers&image_size=square',
      rank: 2,
      previousRank: 1,
      points: 14890,
      level: 26,
      streak: 38,
      badges: ['Dance Master', 'Cultural Keeper', 'Social Butterfly'],
      culturalAchievements: {
        languageProficiency: 88,
        culturalKnowledge: 96,
        socialEngagement: 94,
        creativityScore: 92
      },
      location: 'Moorea, French Polynesia',
      joinedDate: new Date('2023-02-20'),
      lastActive: new Date(Date.now() - 30 * 60 * 1000),
      specialTitles: ['Dance Instructor', 'Cultural Historian'],
      weeklyProgress: 1180,
      monthlyProgress: 4620,
      isOnline: true,
      isFriend: true
    },
    {
      id: '3',
      name: 'James Mitchell',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Young%20man%20learning%20languages%20books%20tropical%20setting&image_size=square',
      rank: 3,
      previousRank: 4,
      points: 13650,
      level: 24,
      streak: 22,
      badges: ['Quick Learner', 'Pronunciation Pro', 'Daily Challenger'],
      culturalAchievements: {
        languageProficiency: 82,
        culturalKnowledge: 78,
        socialEngagement: 85,
        creativityScore: 75
      },
      location: 'California, USA',
      joinedDate: new Date('2023-03-10'),
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      specialTitles: ['Rising Star'],
      weeklyProgress: 980,
      monthlyProgress: 3890,
      isOnline: false,
      isFriend: false
    },
    {
      id: '4',
      name: 'Hinano Temarii',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20woman%20traditional%20dress%20cultural%20setting&image_size=square',
      rank: 4,
      previousRank: 3,
      points: 12980,
      level: 23,
      streak: 31,
      badges: ['Craft Master', 'Tradition Keeper', 'Mentor'],
      culturalAchievements: {
        languageProficiency: 90,
        culturalKnowledge: 94,
        socialEngagement: 80,
        creativityScore: 88
      },
      location: 'Bora Bora, French Polynesia',
      joinedDate: new Date('2023-01-28'),
      lastActive: new Date(Date.now() - 45 * 60 * 1000),
      specialTitles: ['Craft Instructor', 'Elder Wisdom'],
      weeklyProgress: 920,
      monthlyProgress: 3650,
      isOnline: true,
      isFriend: true
    },
    {
      id: '5',
      name: 'Sophie Laurent',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=French%20woman%20learning%20culture%20books%20tropical%20background&image_size=square',
      rank: 5,
      previousRank: 6,
      points: 11750,
      level: 21,
      streak: 18,
      badges: ['Explorer', 'Cultural Enthusiast', 'Friend Maker'],
      culturalAchievements: {
        languageProficiency: 75,
        culturalKnowledge: 82,
        socialEngagement: 88,
        creativityScore: 79
      },
      location: 'Paris, France',
      joinedDate: new Date('2023-04-05'),
      lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000),
      specialTitles: ['Cultural Bridge'],
      weeklyProgress: 850,
      monthlyProgress: 3200,
      isOnline: false,
      isFriend: false
    },
    {
      id: '6',
      name: 'Kai Thompson',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Young%20surfer%20learning%20Polynesian%20culture%20beach%20setting&image_size=square',
      rank: 6,
      previousRank: 5,
      points: 10890,
      level: 19,
      streak: 12,
      badges: ['Ocean Lover', 'Story Collector', 'Community Helper'],
      culturalAchievements: {
        languageProficiency: 70,
        culturalKnowledge: 76,
        socialEngagement: 82,
        creativityScore: 74
      },
      location: 'Hawaii, USA',
      joinedDate: new Date('2023-05-12'),
      lastActive: new Date(Date.now() - 6 * 60 * 60 * 1000),
      specialTitles: ['Ocean Ambassador'],
      weeklyProgress: 780,
      monthlyProgress: 2950,
      isOnline: false,
      isFriend: true
    }
  ]);

  const currentUser = leaderboardData.find(user => user.id === '3'); // James Mitchell as current user

  const getRankChange = (user: LeaderboardUser) => {
    if (!user.previousRank) return null;
    const change = user.previousRank - user.rank;
    if (change > 0) return { type: 'up', value: change };
    if (change < 0) return { type: 'down', value: Math.abs(change) };
    return { type: 'same', value: 0 };
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-gray-600">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-400 to-amber-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const filteredUsers = leaderboardData.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-6xl mx-auto h-[85vh] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cultural Leaderboard</h1>
              <p className="text-orange-100">Celebrating Tahitian learning champions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentUser && (
              <div className="text-center bg-white/10 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm">Your Rank:</span>
                  <span className="text-2xl font-bold">#{currentUser.rank}</span>
                </div>
                <p className="text-xs text-orange-200">{currentUser.points.toLocaleString()} points</p>
              </div>
            )}

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

      {/* Controls */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Timeframe Selector */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              {timeframes.map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id as any)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeframe === tf.id
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span className="mr-1">{tf.icon}</span>
                  {tf.name}
                </button>
              ))}
            </div>

            {/* Category Selector */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as any)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    category === cat.id
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          {/* Top 3 Podium */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">🏆 Top Champions</h3>
            <div className="space-y-3">
              {leaderboardData.slice(0, 3).map((user, index) => (
                <div
                  key={user.id}
                  className={`bg-gradient-to-r ${getRankColor(user.rank)} rounded-lg p-3 text-white`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getRankIcon(user.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-xs opacity-90">{user.points.toLocaleString()} pts</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Community Stats</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Active Learners</span>
                </div>
                <span className="font-semibold text-gray-800">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-600">Avg Streak</span>
                </div>
                <span className="font-semibold text-gray-800">18 days</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Total Points</span>
                </div>
                <span className="font-semibold text-gray-800">2.4M</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Countries</span>
                </div>
                <span className="font-semibold text-gray-800">45</span>
              </div>
            </div>
          </div>

          {/* Achievement Spotlight */}
          <div className="mt-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">🌟 Weekly Spotlight</h4>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <p className="font-medium text-gray-800">Most Improved</p>
              <p className="text-sm text-gray-600">James Mitchell</p>
              <p className="text-xs text-gray-500">+5 ranks this week</p>
            </div>
          </div>
        </div>

        {/* Main Leaderboard */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {category === 'overall' ? 'Overall Rankings' : `${categories.find(c => c.id === category)?.name} Rankings`}
                ({filteredUsers.length})
              </h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm">Friends</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">Global</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">Local</button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredUsers.map((user, index) => {
                const rankChange = getRankChange(user);
                const isCurrentUser = user.id === currentUser?.id;
                
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 border ${
                      isCurrentUser ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="flex flex-col items-center">
                          {getRankIcon(user.rank)}
                          {rankChange && (
                            <div className={`flex items-center mt-1 text-xs ${
                              rankChange.type === 'up' ? 'text-green-600' : 
                              rankChange.type === 'down' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {rankChange.type === 'up' && <ChevronUp className="w-3 h-3" />}
                              {rankChange.type === 'down' && <ChevronDown className="w-3 h-3" />}
                              {rankChange.type === 'same' && <Minus className="w-3 h-3" />}
                              {rankChange.value > 0 && <span>{rankChange.value}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Avatar & Basic Info */}
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="relative">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                          />
                          {user.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                            {user.isFriend && <Heart className="w-4 h-4 text-red-500" />}
                            {isCurrentUser && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">You</span>}
                          </div>
                          <div className="flex items-center space-x-3 mt-1">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600 truncate">{user.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{formatTimeAgo(user.lastActive)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-bold text-gray-900">{user.points.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-500">Points</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4 text-blue-500" />
                            <span className="font-bold text-gray-900">{user.level}</span>
                          </div>
                          <p className="text-xs text-gray-500">Level</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center space-x-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="font-bold text-gray-900">{user.streak}</span>
                          </div>
                          <p className="text-xs text-gray-500">Streak</p>
                        </div>
                      </div>

                      {/* Special Titles */}
                      <div className="flex flex-wrap gap-1 max-w-32">
                        {user.specialTitles.slice(0, 2).map((title, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                          >
                            {title}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isCurrentUser && (
                          <>
                            <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                              <UserPlus className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Bars (for current user) */}
                    {isCurrentUser && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600">Weekly Progress</span>
                              <span className="font-medium">{user.weeklyProgress} pts</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                style={{ width: `${Math.min((user.weeklyProgress / 1500) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600">Monthly Progress</span>
                              <span className="font-medium">{user.monthlyProgress} pts</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
                                style={{ width: `${Math.min((user.monthlyProgress / 6000) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
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
              <div className={`bg-gradient-to-r ${getRankColor(selectedUser.rank)} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                    />
                    <div>
                      <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="flex items-center space-x-1">
                          {getRankIcon(selectedUser.rank)}
                          <span className="font-medium">Rank #{selectedUser.rank}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span>{selectedUser.points.toLocaleString()} points</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Cultural Achievements */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4">Cultural Achievements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Language Proficiency</span>
                        <span className="text-sm font-bold text-blue-600">{selectedUser.culturalAchievements.languageProficiency}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${selectedUser.culturalAchievements.languageProficiency}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Cultural Knowledge</span>
                        <span className="text-sm font-bold text-green-600">{selectedUser.culturalAchievements.culturalKnowledge}%</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${selectedUser.culturalAchievements.culturalKnowledge}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Social Engagement</span>
                        <span className="text-sm font-bold text-orange-600">{selectedUser.culturalAchievements.socialEngagement}%</span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${selectedUser.culturalAchievements.socialEngagement}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Creativity Score</span>
                        <span className="text-sm font-bold text-purple-600">{selectedUser.culturalAchievements.creativityScore}%</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${selectedUser.culturalAchievements.creativityScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Badges & Achievements</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg text-sm font-medium flex items-center space-x-1"
                      >
                        <Award className="w-4 h-4" />
                        <span>{badge}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Special Titles */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Special Titles</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.specialTitles.map((title, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg text-sm font-medium flex items-center space-x-1"
                      >
                        <Crown className="w-4 h-4" />
                        <span>{title}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Add Friend</span>
                  </button>
                  <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                  <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                    <Gift className="w-4 h-4" />
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

export default Leaderboard;
export { Leaderboard };