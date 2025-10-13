'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Trophy, 
  Star, 
  Calendar, 
  Users, 
  BookOpen, 
  Award, 
  Edit3, 
  Settings,
  Heart,
  MessageCircle,
  Share2,
  Crown,
  Flame,
  Target,
  Globe,
  Camera
} from 'lucide-react';
import { useSocialLearning, UserProfile as UserProfileType, Achievement, CulturalBadge } from '@/hooks/useSocialLearning';

interface UserProfileProps {
  userId?: string;
  isOwnProfile?: boolean;
  onClose?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  isOwnProfile = true, 
  onClose 
}) => {
  const { currentUser, updateProfile, addAchievement, addCulturalBadge } = useSocialLearning();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'badges' | 'progress' | 'social'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const levelProgress = (currentUser.xp % 1000) / 1000 * 100;
  const nextLevelXP = (currentUser.level + 1) * 1000;

  const getLevelTitle = (level: number) => {
    if (level < 5) return 'Novice Explorer';
    if (level < 10) return 'Cultural Apprentice';
    if (level < 15) return 'Island Navigator';
    if (level < 20) return 'Polynesian Scholar';
    if (level < 25) return 'Cultural Ambassador';
    return 'Tahitian Master';
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-yellow-500';
      case 'intermediate': return 'bg-blue-500';
      case 'advanced': return 'bg-purple-500';
      case 'native': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-50';
      case 'rare': return 'border-blue-400 bg-blue-50';
      case 'epic': return 'border-purple-400 bg-purple-50';
      case 'legendary': return 'border-yellow-400 bg-yellow-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'badges', label: 'Cultural Badges', icon: Award },
    { id: 'progress', label: 'Progress', icon: Target },
    { id: 'social', label: 'Social', icon: Users }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto"
    >
      {/* Header with tropical gradient */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 via-teal-500 to-green-400 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <span className="text-white text-xl">×</span>
          </button>
        )}

        {/* Profile picture and basic info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end space-x-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
              {isOwnProfile && (
                <button className="absolute bottom-0 right-0 p-1 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                <Crown className="w-4 h-4 text-yellow-800" />
              </div>
            </div>
            
            <div className="flex-1 text-white">
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-blue-100 mb-2">{getLevelTitle(currentUser.level)}</p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span>Level {currentUser.level}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span>{currentUser.streak} day streak</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span>{currentUser.achievements.length} achievements</span>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Add Friend</span>
                </button>
                <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {currentUser.xp} / {nextLevelXP} XP
          </span>
          <span className="text-sm text-gray-500">
            {nextLevelXP - currentUser.xp} XP to next level
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-teal-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Study Groups</p>
                      <p className="text-xl font-bold text-blue-600">{currentUser.studyGroups.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Friends</p>
                      <p className="text-xl font-bold text-green-600">{currentUser.friends.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cultural Badges</p>
                      <p className="text-xl font-bold text-purple-600">{currentUser.culturalBadges.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Language Proficiency */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <span>Language Proficiency</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Tahitian</span>
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getProficiencyColor(currentUser.languageProficiency.tahitian.level)}`}>
                        {currentUser.languageProficiency.tahitian.level}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Vocabulary</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${currentUser.languageProficiency.tahitian.vocabulary}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{currentUser.languageProficiency.tahitian.vocabulary}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Pronunciation</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${currentUser.languageProficiency.tahitian.pronunciation}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{currentUser.languageProficiency.tahitian.pronunciation}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Grammar</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${currentUser.languageProficiency.tahitian.grammar}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{currentUser.languageProficiency.tahitian.grammar}%</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">French</span>
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getProficiencyColor(currentUser.languageProficiency.french.level)}`}>
                        {currentUser.languageProficiency.french.level}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${currentUser.languageProficiency.french.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{currentUser.languageProficiency.french.score}% proficiency</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Trophy className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Earned "Language Enthusiast" achievement</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Joined "Tahitian Beginners Circle" study group</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Award className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Earned "Poisson Cru Chef" cultural badge</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Achievements ({currentUser.achievements.length})</h3>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">All</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">Cultural</span>
                  <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">Language</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs">Social</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentUser.achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl border-2 ${getRarityColor(achievement.rarity)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{achievement.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs capitalize ${
                            achievement.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                            achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                            achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {achievement.rarity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <p className="text-xs text-gray-500">
                          Unlocked {achievement.unlockedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'badges' && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Cultural Badges ({currentUser.culturalBadges.length})</h3>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">All</span>
                  <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">Arts</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">Cuisine</span>
                  <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">Traditions</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentUser.culturalBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
                    style={{ borderLeft: `4px solid ${badge.color}` }}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <h4 className="font-semibold mb-1">{badge.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                      <span className={`px-2 py-1 rounded text-xs capitalize`} style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>
                        {badge.category}
                      </span>
                      <p className="text-xs text-gray-500 mt-2">
                        Earned {badge.earnedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold">Learning Progress</h3>
              
              {/* Learning Streak */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <Flame className="w-6 h-6 text-orange-500" />
                  <h4 className="text-lg font-semibold">Learning Streak</h4>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-orange-600">{currentUser.streak}</div>
                  <div>
                    <p className="text-sm text-gray-600">days in a row</p>
                    <p className="text-xs text-gray-500">Keep it up! You're on fire! 🔥</p>
                  </div>
                </div>
              </div>

              {/* Weekly Goals */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="text-lg font-semibold mb-4">Weekly Goals</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Complete 5 lessons</span>
                      <span className="text-sm text-gray-500">3/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Practice pronunciation 30 minutes</span>
                      <span className="text-sm text-gray-500">22/30 min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '73%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Participate in forum discussions</span>
                      <span className="text-sm text-gray-500">2/3</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '67%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Calendar */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="text-lg font-semibold mb-4">Learning Calendar</h4>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="text-xs font-medium text-gray-500 p-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }, (_, index) => {
                    const isActive = Math.random() > 0.3;
                    const isToday = index === 15;
                    return (
                      <div
                        key={index}
                        className={`w-8 h-8 rounded text-xs flex items-center justify-center ${
                          isToday
                            ? 'bg-blue-500 text-white'
                            : isActive
                            ? 'bg-green-200 text-green-800'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'social' && (
            <motion.div
              key="social"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold">Social Connections</h3>
              
              {/* Friend Requests */}
              <div className="bg-blue-50 p-6 rounded-xl">
                <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>Friend Requests (2)</span>
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'Maeva Terehia', avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20tahitian%20woman%20smiling&image_size=square' },
                    { name: 'Teiki Raapoto', avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20tahitian%20man%20smiling&image_size=square' }
                  ].map((request, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img src={request.avatar} alt={request.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-medium">{request.name}</p>
                          <p className="text-sm text-gray-500">Wants to be your friend</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                          Accept
                        </button>
                        <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Group Invitations */}
              <div className="bg-green-50 p-6 rounded-xl">
                <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  <span>Study Group Invitations (1)</span>
                </h4>
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Cultural Heritage Explorers</p>
                      <p className="text-sm text-gray-500">Invited by Moana Terehia</p>
                      <p className="text-xs text-gray-400">Intermediate level • 12 members</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
                        Join
                      </button>
                      <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors">
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Social Activity */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="text-lg font-semibold mb-4">Recent Social Activity</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <Heart className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm"><span className="font-medium">Teiva Marama</span> liked your forum post</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm"><span className="font-medium">Moana Terehia</span> replied to your comment</p>
                      <p className="text-xs text-gray-500">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <Users className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm"><span className="font-medium">Teiki Raapoto</span> joined your study group</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export { UserProfile };
export default UserProfile;