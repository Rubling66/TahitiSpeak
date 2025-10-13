// src/app/page.tsx - Sprint 10: Enhanced User Engagement Integration
'use client';

import { useState } from 'react';
import { TropicalHero } from '@/components/TropicalHero'; 
import { CulturalFeatures } from '@/components/CulturalFeatures'; 
import { TropicalLessonUI } from '@/components/TropicalLessonUI'; 
import { CulturalImmersion } from '@/components/CulturalImmersion'; 
import { TropicalNavigation } from '@/components/TropicalNavigation'; 
import { AICulturalCompanion } from '@/components/AICulturalCompanion'; 
import { CulturalMap } from '@/components/CulturalMap'; 
import { IslandProgression } from '@/components/IslandProgression'; 
import { AchievementSystem } from '@/components/AchievementSystem'; 
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

// Sprint 10: Social Learning Features
import { UserProfile } from '@/components/UserProfile';
import { CommunityForum } from '@/components/CommunityForum';
import { StudyGroups } from '@/components/StudyGroups';

// Sprint 10: Gamification Enhancements
import { DailyChallenges } from '@/components/DailyChallenges';
import { Leaderboard } from '@/components/Leaderboard';
import { CollaborativeQuests } from '@/components/CollaborativeQuests';

// Sprint 10: Real-time Collaboration
import { LivePractice } from '@/components/LivePractice';
import { CulturalEvents } from '@/components/CulturalEvents';

// Sprint 10: Engagement Analytics
import { EngagementDashboard } from '@/components/EngagementDashboard';

import { 
  BarChart3, X, TrendingUp, Users, MessageSquare, Trophy, 
  Video, Calendar, Target, Heart, Zap, Globe 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() { 
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsMinimized, setAnalyticsMinimized] = useState(false);
  
  // Sprint 10: Enhanced User Engagement State
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [showSocialLearning, setShowSocialLearning] = useState(false);
  const [showEngagementAnalytics, setShowEngagementAnalytics] = useState(false);

  const toggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
    setAnalyticsMinimized(false);
  };

  const toggleAnalyticsMinimize = () => {
    setAnalyticsMinimized(!analyticsMinimized);
  };

  const toggleFeature = (feature: string) => {
    if (activeFeature === feature) {
      setActiveFeature(null);
    } else {
      setActiveFeature(feature);
    }
  };

  const toggleSocialLearning = () => {
    setShowSocialLearning(!showSocialLearning);
    setActiveFeature(null);
  };

  const toggleEngagementAnalytics = () => {
    setShowEngagementAnalytics(!showEngagementAnalytics);
    setActiveFeature(null);
  };

  return ( 
    <div className="min-h-screen relative"> 
      <TropicalNavigation /> 
      
      {/* Analytics Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={toggleAnalytics}
        className="fixed top-20 right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-110"
        title="Toggle Analytics Dashboard"
      >
        {showAnalytics ? <X className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
      </motion.button>

      {/* Sprint 10: Enhanced Controls Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-32 right-6 z-40 space-y-3"
      >
        {/* Performance Indicator */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="text-white text-sm font-medium">Sprint 10 Active</span>
          </div>
        </div>

        {/* Social Learning Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={toggleSocialLearning}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          title="Toggle Social Learning"
        >
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Social</span>
          </div>
        </motion.button>

        {/* Engagement Analytics Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={toggleEngagementAnalytics}
          className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white p-3 rounded-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300"
          title="Toggle Engagement Analytics"
        >
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Engage</span>
          </div>
        </motion.button>
      </motion.div>

      {/* Analytics Dashboard Overlay */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <AnalyticsDashboard 
              isMinimized={analyticsMinimized}
              onToggleMinimize={toggleAnalyticsMinimize}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Minimized View */}
      {showAnalytics && analyticsMinimized && (
        <AnalyticsDashboard 
          isMinimized={true}
          onToggleMinimize={toggleAnalyticsMinimize}
        />
      )}

      {/* Sprint 10: Social Learning Overlay */}
      <AnimatePresence>
        {showSocialLearning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          >
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white">Social Learning Hub</h2>
                  <button
                    onClick={toggleSocialLearning}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <UserProfile />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CommunityForum />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <StudyGroups />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <DailyChallenges />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Leaderboard />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <CollaborativeQuests />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <LivePractice />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <CulturalEvents />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sprint 10: Engagement Analytics Overlay */}
      <AnimatePresence>
        {showEngagementAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <div className="relative h-full">
              <button
                onClick={toggleEngagementAnalytics}
                className="absolute top-6 right-6 z-10 p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <EngagementDashboard />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className={showAnalytics && !analyticsMinimized ? 'blur-sm pointer-events-none' : ''}> 
        <TropicalHero /> 
        <CulturalFeatures /> 
        
        {/* AI & Cultural Section */} 
        <section className="py-20 bg-tropical-sand"> 
          <div className="container mx-auto px-6"> 
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"> 
              <AICulturalCompanion /> 
              <CulturalMap /> 
            </div> 
          </div> 
        </section> 

        <TropicalLessonUI /> 
        <CulturalImmersion /> 
        
        {/* Gamification Section */} 
        <section className="py-20 bg-gradient-to-b from-tropical-ocean to-tropical-lagoon"> 
          <div className="container mx-auto px-6 space-y-16"> 
            <IslandProgression /> 
            <AchievementSystem /> 
          </div> 
        </section> 
        
        {/* Sprint 10: Enhanced User Engagement Section */}
        <section className="py-20 bg-gradient-to-br from-purple-900/20 to-pink-900/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-tropical-heading text-4xl md:text-5xl text-tropical-ocean mb-6">
                👥 Enhanced User Engagement
              </h2>
              <p className="text-xl text-tropical-ocean/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                Connect with fellow learners, participate in cultural events, and track your engagement with advanced social learning features and real-time collaboration tools.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                onClick={() => toggleFeature('social')}
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-tropical-ocean mb-3">Social Learning</h3>
                <p className="text-tropical-ocean/70 text-sm">
                  Connect with study groups, find language partners, and participate in cultural forums.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                onClick={() => toggleFeature('gamification')}
              >
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-tropical-ocean mb-3">Gamification</h3>
                <p className="text-tropical-ocean/70 text-sm">
                  Daily challenges, leaderboards, and collaborative quests with cultural rewards.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                onClick={() => toggleFeature('collaboration')}
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-tropical-ocean mb-3">Live Collaboration</h3>
                <p className="text-tropical-ocean/70 text-sm">
                  Voice/video practice sessions, screen sharing, and real-time cultural events.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                onClick={() => toggleFeature('analytics')}
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-tropical-ocean mb-3">Engagement Analytics</h3>
                <p className="text-tropical-ocean/70 text-sm">
                  Track community health, user engagement, and retention optimization.
                </p>
              </motion.div>
            </div>

            {/* Feature Details */}
            <AnimatePresence>
              {activeFeature && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 mb-8"
                >
                  {activeFeature === 'social' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <MessageSquare className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">Community Forums</h4>
                        <p className="text-tropical-ocean/70 text-sm">Discuss Tahitian culture, traditions, and language learning tips</p>
                      </div>
                      <div className="text-center">
                        <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">Study Groups</h4>
                        <p className="text-tropical-ocean/70 text-sm">Join or create study groups with learners at your level</p>
                      </div>
                      <div className="text-center">
                        <Globe className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">Language Partners</h4>
                        <p className="text-tropical-ocean/70 text-sm">Connect with native speakers for authentic practice</p>
                      </div>
                    </div>
                  )}

                  {activeFeature === 'gamification' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <Calendar className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">Daily Challenges</h4>
                        <p className="text-tropical-ocean/70 text-sm">Complete cultural tasks and language exercises daily</p>
                      </div>
                      <div className="text-center">
                        <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">Leaderboards</h4>
                        <p className="text-tropical-ocean/70 text-sm">Compete with friends in cultural knowledge rankings</p>
                      </div>
                      <div className="text-center">
                        <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">Collaborative Quests</h4>
                        <p className="text-tropical-ocean/70 text-sm">Team up for group challenges and shared achievements</p>
                      </div>
                    </div>
                  )}

                  {activeFeature === 'collaboration' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <Video className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">Live Practice Sessions</h4>
                        <p className="text-tropical-ocean/70 text-sm">Voice and video chat for real-time language practice with pronunciation feedback</p>
                      </div>
                      <div className="text-center">
                        <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">Cultural Events</h4>
                        <p className="text-tropical-ocean/70 text-sm">Join live workshops, virtual tours, and community celebrations</p>
                      </div>
                    </div>
                  )}

                  {activeFeature === 'analytics' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">User Engagement</h4>
                        <p className="text-tropical-ocean/70 text-sm">Track activity levels and participation metrics</p>
                      </div>
                      <div className="text-center">
                        <Heart className="w-8 h-8 text-green-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">Community Health</h4>
                        <p className="text-tropical-ocean/70 text-sm">Monitor social interactions and network growth</p>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-tropical-ocean mb-2">Retention Optimization</h4>
                        <p className="text-tropical-ocean/70 text-sm">AI-powered insights for personalized engagement</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={toggleSocialLearning}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Explore Social Learning
                </button>
                <button
                  onClick={toggleEngagementAnalytics}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  View Engagement Analytics
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sprint 9 Analytics Integration Section */}
        <section className="py-20 bg-gradient-to-br from-blue-900/20 to-purple-900/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-tropical-heading text-4xl md:text-5xl text-tropical-ocean mb-6">
                🔍 Advanced Analytics & Insights
              </h2>
              <p className="text-xl text-tropical-ocean/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                Experience real-time analytics with anomaly detection, predictive insights, and cultural engagement metrics. 
                Monitor your learning journey with AI-powered analytics.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-tropical-ocean mb-3">Real-time Monitoring</h3>
                <p className="text-tropical-ocean/70">
                  Track user engagement, learning progress, and cultural interaction patterns in real-time with advanced analytics.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-tropical-ocean mb-3">Predictive Analytics</h3>
                <p className="text-tropical-ocean/70">
                  AI-powered predictions for learning outcomes, cultural engagement trends, and personalized recommendations.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🌺</span>
                </div>
                <h3 className="text-xl font-semibold text-tropical-ocean mb-3">Cultural Insights</h3>
                <p className="text-tropical-ocean/70">
                  Deep cultural analytics that understand Tahitian traditions, festivals, and learning patterns for authentic experiences.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center mt-12"
            >
              <button
                onClick={toggleAnalytics}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                {showAnalytics ? 'Hide Analytics Dashboard' : 'Explore Analytics Dashboard'}
              </button>
            </motion.div>
          </div>
        </section>
        
        {/* Final CTA */} 
        <section className="py-20 bg-tropical-sand"> 
          <div className="container mx-auto px-6 text-center"> 
            <h2 className="font-tropical-heading text-4xl md:text-5xl text-tropical-ocean mb-6"> 
              Begin Your Tahitian Journey Today 
            </h2> 
            <p className="text-xl text-tropical-ocean/80 mb-8 max-w-2xl mx-auto leading-relaxed"> 
              Join a community of language lovers discovering the beauty of Tahitian culture. 
              Start with basic greetings and progress to meaningful conversations with AI-powered analytics tracking your progress.
            </p> 
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center"> 
              <button className="bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"> 
                Start Learning Free 
              </button> 
              <button className="border-2 border-tropical-ocean text-tropical-ocean hover:bg-tropical-ocean hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"> 
                Take a Tour 
              </button> 
            </div> 
          </div> 
        </section> 
      </main> 

      <footer className={`bg-tropical-ocean text-tropical-sand py-12 ${showAnalytics && !analyticsMinimized ? 'blur-sm' : ''}`}> 
        <div className="container mx-auto px-6 text-center"> 
          <div className="flex items-center justify-center gap-3 mb-6"> 
            <div className="w-8 h-8 bg-tropical-coral rounded-lg flex items-center justify-center"> 
              <span className="text-white font-semibold">🌺</span> 
            </div> 
            <span className="font-tropical-heading text-2xl">Tahiti Speaks</span> 
          </div> 
          <p className="text-tropical-sand/80 max-w-md mx-auto mb-6"> 
            Preserving and sharing the beautiful Tahitian language with the world through immersive, culturally-rich learning experiences powered by advanced analytics.
          </p> 
          <div className="text-tropical-sand/60 text-sm"> 
            © 2024 Tahiti Speaks. All rights reserved. • Sprint 9: Advanced Analytics Active
          </div> 
        </div> 
      </footer> 
    </div> 
  ); 
}
