'use client';

import { useState } from 'react';
import { Trophy, Star, Award, Target, Zap, Crown, Gift, Calendar } from 'lucide-react';

export const AchievementSystem = () => {
  const [activeTab, setActiveTab] = useState('achievements');

  const achievements = [
    {
      id: 1,
      title: "First Words",
      description: "Complete your first Tahitian lesson",
      icon: Star,
      progress: 100,
      unlocked: true,
      rarity: "common",
      points: 50,
      unlockedDate: "2024-01-15"
    },
    {
      id: 2,
      title: "Cultural Explorer",
      description: "Learn about 5 different Tahitian traditions",
      icon: Trophy,
      progress: 80,
      unlocked: false,
      rarity: "rare",
      points: 150,
      unlockedDate: null
    },
    {
      id: 3,
      title: "Pronunciation Master",
      description: "Perfect pronunciation on 20 words",
      icon: Award,
      progress: 65,
      unlocked: false,
      rarity: "epic",
      points: 300,
      unlockedDate: null
    },
    {
      id: 4,
      title: "Island Hopper",
      description: "Complete lessons from all 5 island regions",
      icon: Target,
      progress: 40,
      unlocked: false,
      rarity: "legendary",
      points: 500,
      unlockedDate: null
    },
    {
      id: 5,
      title: "Daily Learner",
      description: "Study for 7 consecutive days",
      icon: Calendar,
      progress: 100,
      unlocked: true,
      rarity: "common",
      points: 100,
      unlockedDate: "2024-01-20"
    },
    {
      id: 6,
      title: "Speed Demon",
      description: "Complete a lesson in under 5 minutes",
      icon: Zap,
      progress: 100,
      unlocked: true,
      rarity: "rare",
      points: 200,
      unlockedDate: "2024-01-18"
    }
  ];

  const badges = [
    {
      id: 1,
      title: "Beginner",
      description: "Started your Tahitian journey",
      icon: Star,
      earned: true,
      level: 1
    },
    {
      id: 2,
      title: "Conversationalist",
      description: "Can hold basic conversations",
      icon: Crown,
      earned: false,
      level: 2
    },
    {
      id: 3,
      title: "Cultural Ambassador",
      description: "Deep understanding of Tahitian culture",
      icon: Gift,
      earned: false,
      level: 3
    }
  ];

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'from-gray-400 to-gray-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-yellow-600'
    };
    return colors[rarity] || 'from-gray-400 to-gray-600';
  };

  const getRarityBorder = (rarity) => {
    const colors = {
      common: 'border-gray-300',
      rare: 'border-blue-300',
      epic: 'border-purple-300',
      legendary: 'border-yellow-300'
    };
    return colors[rarity] || 'border-gray-300';
  };

  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-tropical-lagoon/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-tropical-coral to-tropical-sunset p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-tropical-heading text-2xl">Achievement Center</h3>
              <p className="text-white/80">Track your learning milestones</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-white/80 text-sm">Total Points</div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-tropical-sand/20 p-4 border-b border-tropical-lagoon/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-tropical-ocean">{unlockedCount}</div>
            <div className="text-tropical-ocean/60 text-sm">Achievements</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-tropical-ocean">{badges.filter(b => b.earned).length}</div>
            <div className="text-tropical-ocean/60 text-sm">Badges</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-tropical-ocean">Level 3</div>
            <div className="text-tropical-ocean/60 text-sm">Current Level</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-tropical-lagoon/20">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-4 px-6 font-semibold transition-colors duration-300 ${
            activeTab === 'achievements'
              ? 'text-tropical-coral border-b-2 border-tropical-coral bg-tropical-coral/5'
              : 'text-tropical-ocean/60 hover:text-tropical-ocean'
          }`}
        >
          Achievements
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-4 px-6 font-semibold transition-colors duration-300 ${
            activeTab === 'badges'
              ? 'text-tropical-coral border-b-2 border-tropical-coral bg-tropical-coral/5'
              : 'text-tropical-ocean/60 hover:text-tropical-ocean'
          }`}
        >
          Badges
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {achievements.map((achievement) => {
              const IconComponent = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                    achievement.unlocked
                      ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)}/10 ${getRarityBorder(achievement.rarity)} shadow-lg`
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      achievement.unlocked
                        ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)}`
                        : 'bg-gray-300'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold ${achievement.unlocked ? 'text-tropical-ocean' : 'text-gray-500'}`}>
                          {achievement.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${achievement.unlocked ? 'text-tropical-coral' : 'text-gray-400'}`}>
                            {achievement.points} pts
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            achievement.unlocked
                              ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            {achievement.rarity}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm mb-3 ${achievement.unlocked ? 'text-tropical-ocean/70' : 'text-gray-400'}`}>
                        {achievement.description}
                      </p>
                      
                      {achievement.unlocked ? (
                        <div className="flex items-center gap-2 text-sm text-tropical-coral">
                          <Star className="w-4 h-4" />
                          Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="text-gray-600">{achievement.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-tropical-coral to-tropical-sunset h-2 rounded-full transition-all duration-300"
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {badges.map((badge) => {
              const IconComponent = badge.icon;
              return (
                <div
                  key={badge.id}
                  className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 ${
                    badge.earned
                      ? 'bg-gradient-to-br from-tropical-coral/10 to-tropical-sunset/10 border-tropical-coral shadow-lg'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    badge.earned
                      ? 'bg-gradient-to-br from-tropical-coral to-tropical-sunset'
                      : 'bg-gray-300'
                  }`}>
                    <IconComponent className={`w-8 h-8 ${badge.earned ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  
                  <h4 className={`font-tropical-heading text-lg mb-2 ${badge.earned ? 'text-tropical-ocean' : 'text-gray-500'}`}>
                    {badge.title}
                  </h4>
                  
                  <p className={`text-sm mb-4 ${badge.earned ? 'text-tropical-ocean/70' : 'text-gray-400'}`}>
                    {badge.description}
                  </p>
                  
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    badge.earned
                      ? 'bg-tropical-coral text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    Level {badge.level}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};