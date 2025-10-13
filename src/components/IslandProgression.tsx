'use client';

import { useState } from 'react';
import { Award, Trophy, Star, Zap, Lock, CheckCircle } from 'lucide-react';

const islands = [
  {
    id: 1,
    name: "Motu Intro",
    description: "Begin your Tahitian journey",
    level: "Beginner",
    progress: 100,
    unlocked: true,
    lessons: 5,
    completed: 5,
    color: "from-tropical-lagoon to-tropical-ocean",
    reward: "Basic Greetings Master"
  },
  {
    id: 2,
    name: "Tahiti Nui",
    description: "Everyday conversations",
    level: "Elementary",
    progress: 80,
    unlocked: true,
    lessons: 8,
    completed: 6,
    color: "from-tropical-coral to-tropical-sunset",
    reward: "Conversation Starter"
  },
  {
    id: 3,
    name: "Mo'orea",
    description: "Cultural immersion",
    level: "Intermediate",
    progress: 30,
    unlocked: true,
    lessons: 10,
    completed: 3,
    color: "from-tropical-palm to-tropical-lagoon",
    reward: "Cultural Explorer"
  },
  {
    id: 4,
    name: "Bora Bora",
    description: "Advanced expressions",
    level: "Advanced",
    progress: 0,
    unlocked: false,
    lessons: 12,
    completed: 0,
    color: "from-tropical-ocean to-tropical-lagoon",
    reward: "Language Master"
  },
  {
    id: 5,
    name: "Marquesas",
    description: "Native fluency",
    level: "Expert",
    progress: 0,
    unlocked: false,
    lessons: 15,
    completed: 0,
    color: "from-tropical-sunset to-tropical-coral",
    reward: "Tahitian Ambassador"
  }
];

export const IslandProgression = () => {
  const [selectedIsland, setSelectedIsland] = useState(islands[0]);

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-tropical-lagoon/20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-tropical-sunset to-tropical-coral rounded-2xl flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-tropical-heading text-2xl text-tropical-ocean">
            Island Progression
          </h2>
          <p className="text-tropical-ocean/70">
            Journey through Tahiti as you master the language
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Map */}
        <div className="lg:col-span-2">
          <div className="relative bg-gradient-to-br from-tropical-sand to-tropical-plumeria rounded-2xl p-6 min-h-[400px] border-2 border-tropical-lagoon/30">
            {/* Ocean Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-tropical-lagoon/20 to-tropical-ocean/20 rounded-2xl"></div>
            
            {/* Islands */}
            {islands.map((island, index) => (
              <button
                key={island.id}
                onClick={() => setSelectedIsland(island)}
                disabled={!island.unlocked}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                  !island.unlocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                } ${
                  selectedIsland.id === island.id ? 'scale-110 z-10' : ''
                }`}
                style={{
                  left: `${20 + index * 15}%`,
                  top: `${50 + Math.sin(index) * 20}%`
                }}
              >
                {/* Island Visualization */}
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${island.color} shadow-2xl border-2 border-white/30 flex items-center justify-center relative ${
                  selectedIsland.id === island.id ? 'ring-4 ring-tropical-coral ring-opacity-50' : ''
                }`}>
                  {island.unlocked ? (
                    island.progress === 100 ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <Award className="w-8 h-8 text-white" />
                    )
                  ) : (
                    <Lock className="w-8 h-8 text-white" />
                  )}
                  
                  {/* Progress Ring */}
                  {island.unlocked && island.progress > 0 && (
                    <svg className="absolute inset-0 w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="38"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 38 * island.progress / 100} ${2 * Math.PI * 38}`}
                      />
                    </svg>
                  )}
                </div>
                
                {/* Island Name */}
                <div className="text-center mt-2">
                  <div className="font-tropical-heading text-sm text-tropical-ocean whitespace-nowrap">
                    {island.name}
                  </div>
                  <div className="text-xs text-tropical-ocean/70">
                    {island.level}
                  </div>
                </div>
              </button>
            ))}

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              {islands.slice(0, -1).map((island, index) => (
                <line
                  key={index}
                  x1={`${20 + index * 15}%`}
                  y1={`${50 + Math.sin(index) * 20}%`}
                  x2={`${20 + (index + 1) * 15}%`}
                  y2={`${50 + Math.sin(index + 1) * 20}%`}
                  stroke={islands[index + 1].unlocked ? "url(#gradient)" : "#CBD5E1"}
                  strokeWidth="2"
                  strokeDasharray={islands[index + 1].unlocked ? "none" : "5,5"}
                  className="transition-all duration-500"
                />
              ))}
            </svg>

            {/* Floating Elements */}
            <div className="absolute top-4 right-4 animate-float">
              <div className="w-8 h-8 bg-tropical-plumeria/30 rounded-full"></div>
            </div>
            <div className="absolute bottom-8 left-8 animate-float-delayed">
              <div className="w-6 h-6 bg-tropical-coral/30 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Island Details */}
        <div className="space-y-6">
          {/* Selected Island Info */}
          <div className={`bg-gradient-to-br ${selectedIsland.color} rounded-2xl p-6 text-white shadow-xl`}>
            <div className="flex items-center gap-3 mb-4">
              {selectedIsland.unlocked ? (
                selectedIsland.progress === 100 ? (
                  <CheckCircle className="w-8 h-8" />
                ) : (
                  <Award className="w-8 h-8" />
                )
              ) : (
                <Lock className="w-8 h-8" />
              )}
              <div>
                <h3 className="font-tropical-heading text-xl">{selectedIsland.name}</h3>
                <p className="text-white/80 text-sm">{selectedIsland.level}</p>
              </div>
            </div>
            
            <p className="text-white/90 mb-4">{selectedIsland.description}</p>
            
            {selectedIsland.unlocked && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{selectedIsland.progress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${selectedIsland.progress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm mt-4">
                  <span>Lessons: {selectedIsland.completed}/{selectedIsland.lessons}</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current" />
                    {selectedIsland.completed * 10}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reward Preview */}
          <div className="bg-white rounded-2xl p-6 border-2 border-tropical-lagoon/20 shadow-lg">
            <h4 className="font-tropical-heading text-lg text-tropical-ocean mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Island Reward
            </h4>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <div className="text-sm font-semibold text-tropical-ocean">{selectedIsland.reward}</div>
              <div className="text-xs text-tropical-ocean/60 mt-1">
                {selectedIsland.unlocked 
                  ? selectedIsland.progress === 100 
                    ? "Earned!" 
                    : `${100 - selectedIsland.progress}% to unlock`
                  : "Complete previous island to unlock"
                }
              </div>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="bg-white rounded-2xl p-6 border-2 border-tropical-coral/20 shadow-lg">
            <h4 className="font-tropical-heading text-lg text-tropical-ocean mb-4">Your Journey</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-tropical-ocean/70">Islands Unlocked</span>
                <span className="font-semibold text-tropical-ocean">
                  {islands.filter(i => i.unlocked).length}/{islands.length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-tropical-ocean/70">Total Lessons</span>
                <span className="font-semibold text-tropical-ocean">
                  {islands.reduce((acc, i) => acc + i.completed, 0)}/
                  {islands.filter(i => i.unlocked).reduce((acc, i) => acc + i.lessons, 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-tropical-ocean/70">Rewards Earned</span>
                <span className="font-semibold text-tropical-ocean">
                  {islands.filter(i => i.progress === 100).length}
                </span>
              </div>
            </div>

            {/* Next Goal */}
            <div className="mt-4 p-3 bg-tropical-lagoon/10 rounded-xl">
              <div className="text-xs text-tropical-ocean/60 mb-1">Next Goal</div>
              <div className="text-sm font-semibold text-tropical-ocean">
                {selectedIsland.unlocked 
                  ? selectedIsland.progress < 100 
                    ? `Complete ${selectedIsland.name}`
                    : "Unlock next island"
                  : `Unlock ${selectedIsland.name}`
                }
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            disabled={!selectedIsland.unlocked}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
              selectedIsland.unlocked
                ? 'bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white hover:scale-105 shadow-xl'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {selectedIsland.unlocked 
              ? selectedIsland.progress < 100 
                ? "Continue Learning" 
                : "Review Island"
              : "Locked"
            }
          </button>
        </div>
      </div>
    </div>
  );
};