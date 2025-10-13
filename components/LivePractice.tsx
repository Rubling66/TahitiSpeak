'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff, 
  Phone, 
  PhoneOff,
  MessageCircle,
  Users,
  Settings,
  Volume2,
  VolumeX,
  Camera,
  Share2,
  Crown,
  Heart,
  Star,
  Send,
  Smile,
  MoreVertical,
  UserPlus,
  Shield,
  Award,
  Zap,
  Globe,
  BookOpen,
  Headphones,
  Radio,
  Waves,
  Sun,
  Moon,
  Compass,
  Map,
  Flag,
  Gift,
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  Calendar,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  X
} from 'lucide-react';
import { useCollaboration } from '@/hooks/useCollaboration';

interface LivePracticeProps {
  onClose?: () => void;
}

const LivePractice: React.FC<LivePracticeProps> = ({ onClose }) => {
  const { state, actions } = useCollaboration();
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    description: '',
    type: 'language_practice' as const,
    maxParticipants: 8,
    language: 'tahitian' as const,
    culturalFocus: ''
  });
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [audioLevel, setAudioLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [state.currentSession?.chatMessages]);

  // Simulate connection status
  useEffect(() => {
    if (state.currentSession) {
      setConnectionStatus('connecting');
      setTimeout(() => setConnectionStatus('connected'), 2000);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [state.currentSession]);

  // Simulate audio level
  useEffect(() => {
    if (state.audioEnabled) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [state.audioEnabled]);

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      actions.sendMessage(chatMessage);
      setChatMessage('');
    }
  };

  const handleCreateSession = async () => {
    await actions.createSession(newSessionData);
    setIsCreatingSession(false);
    setNewSessionData({
      title: '',
      description: '',
      type: 'language_practice',
      maxParticipants: 8,
      language: 'tahitian',
      culturalFocus: ''
    });
  };

  const handleJoinSession = async (sessionId: string) => {
    await actions.joinSession(sessionId);
    setSelectedSession(sessionId);
  };

  const getConnectionQualityColor = () => {
    switch (state.connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionQualityIcon = () => {
    switch (state.connectionQuality) {
      case 'excellent': return <Zap className="w-4 h-4" />;
      case 'good': return <Radio className="w-4 h-4" />;
      case 'fair': return <Waves className="w-4 h-4" />;
      case 'poor': return <AlertCircle className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!state.currentSession) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-6xl mx-auto h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Video className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Live Practice Sessions</h1>
                <p className="text-blue-100">Connect with native speakers and fellow learners</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsCreatingSession(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Session</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Available Sessions */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Available Practice Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.availableSessions
                .filter(session => session.status === 'active' || session.status === 'waiting')
                .map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-xl">
                        {session.type === 'language_practice' && '🗣️'}
                        {session.type === 'cultural_workshop' && '🎭'}
                        {session.type === 'study_group' && '📚'}
                        {session.type === 'virtual_tour' && '🗺️'}
                        {session.type === 'cooking_class' && '👨‍🍳'}
                        {session.type === 'dance_lesson' && '💃'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{session.title}</h3>
                        <p className="text-sm text-gray-600 capitalize">{session.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        session.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-xs text-gray-500 capitalize">{session.status}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{session.description}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Host:</span>
                      <div className="flex items-center space-x-2">
                        <img
                          src={session.host.avatar}
                          alt={session.host.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-medium">{session.host.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Participants:</span>
                      <span className="font-medium">{session.participants.length}/{session.maxParticipants}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Language:</span>
                      <span className="font-medium capitalize">{session.language}</span>
                    </div>

                    {session.status === 'active' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">{formatDuration(session.startTime)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleJoinSession(session.id)}
                      disabled={session.participants.length >= session.maxParticipants}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Session</span>
                    </button>
                    <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cultural Tips */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>Cultural Practice Tips</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.culturalTips.slice(0, 4).map((tip) => (
                <div key={tip.id} className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      {tip.category === 'pronunciation' && '🗣️'}
                      {tip.category === 'etiquette' && '🙏'}
                      {tip.category === 'tradition' && '🌺'}
                      {tip.category === 'language' && '📚'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 mb-1">{tip.tip}</p>
                      <p className="text-xs text-gray-600">{tip.context}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Create Session Modal */}
        <AnimatePresence>
          {isCreatingSession && (
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
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Create Practice Session</h3>
                  <button
                    onClick={() => setIsCreatingSession(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Title</label>
                    <input
                      type="text"
                      value={newSessionData.title}
                      onChange={(e) => setNewSessionData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Tahitian Pronunciation Practice"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newSessionData.description}
                      onChange={(e) => setNewSessionData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Describe what you'll practice in this session..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                      <select
                        value={newSessionData.type}
                        onChange={(e) => setNewSessionData(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="language_practice">Language Practice</option>
                        <option value="cultural_workshop">Cultural Workshop</option>
                        <option value="study_group">Study Group</option>
                        <option value="virtual_tour">Virtual Tour</option>
                        <option value="cooking_class">Cooking Class</option>
                        <option value="dance_lesson">Dance Lesson</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={newSessionData.language}
                        onChange={(e) => setNewSessionData(prev => ({ ...prev, language: e.target.value as any }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="tahitian">Tahitian</option>
                        <option value="french">French</option>
                        <option value="english">English</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                      <input
                        type="number"
                        min="2"
                        max="20"
                        value={newSessionData.maxParticipants}
                        onChange={(e) => setNewSessionData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cultural Focus</label>
                      <input
                        type="text"
                        value={newSessionData.culturalFocus}
                        onChange={(e) => setNewSessionData(prev => ({ ...prev, culturalFocus: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Traditional greetings"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setIsCreatingSession(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSession}
                    disabled={!newSessionData.title.trim()}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Session
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Active Session View
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`bg-gray-900 text-white overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : 'rounded-2xl shadow-2xl max-w-7xl mx-auto h-[85vh]'
      } flex flex-col`}
    >
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">{state.currentSession.title}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(state.currentSession.startTime)}</span>
          </div>

          <div className={`flex items-center space-x-1 text-sm ${getConnectionQualityColor()}`}>
            {getConnectionQualityIcon()}
            <span className="capitalize">{state.connectionQuality}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">{state.currentSession.participants.length + 1}</span>
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={actions.leaveSession}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 relative bg-gray-800">
          {/* Video Grid */}
          <div className="absolute inset-0 p-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Host Video */}
              <div className="relative bg-gray-700 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs flex items-center space-x-2">
                  <Crown className="w-3 h-3 text-yellow-400" />
                  <span>{state.currentSession.host.name}</span>
                  {state.currentSession.host.isSpeaking && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex space-x-1">
                  {state.currentSession.host.hasVideo ? (
                    <Video className="w-4 h-4 text-green-400" />
                  ) : (
                    <VideoOff className="w-4 h-4 text-red-400" />
                  )}
                  {state.currentSession.host.hasAudio ? (
                    <Mic className="w-4 h-4 text-green-400" />
                  ) : (
                    <MicOff className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>

              {/* Participant Videos */}
              {state.currentSession.participants.map((participant) => (
                <div key={participant.id} className="relative bg-gray-700 rounded-lg overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className="w-20 h-20 rounded-full"
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs flex items-center space-x-2">
                    <span>{participant.name}</span>
                    {participant.isSpeaking && (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {participant.hasVideo ? (
                      <Video className="w-4 h-4 text-green-400" />
                    ) : (
                      <VideoOff className="w-4 h-4 text-red-400" />
                    )}
                    {participant.hasAudio ? (
                      <Mic className="w-4 h-4 text-green-400" />
                    ) : (
                      <MicOff className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  {participant.languageLevel && (
                    <div className="absolute top-2 left-2 bg-blue-500/80 px-2 py-1 rounded text-xs">
                      {participant.languageLevel}
                    </div>
                  )}
                </div>
              ))}

              {/* Your Video */}
              <div className="relative bg-gray-700 rounded-lg overflow-hidden border-2 border-blue-500">
                <div className="w-full h-full flex items-center justify-center">
                  {state.videoEnabled ? (
                    <div className="text-4xl">📹</div>
                  ) : (
                    <div className="text-4xl">👤</div>
                  )}
                </div>
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs flex items-center space-x-2">
                  <span>You</span>
                  {state.audioEnabled && audioLevel > 20 && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex space-x-1">
                  {state.videoEnabled ? (
                    <Video className="w-4 h-4 text-green-400" />
                  ) : (
                    <VideoOff className="w-4 h-4 text-red-400" />
                  )}
                  {state.audioEnabled ? (
                    <Mic className="w-4 h-4 text-green-400" />
                  ) : (
                    <MicOff className="w-4 h-4 text-red-400" />
                  )}
                </div>
                {state.audioEnabled && (
                  <div className="absolute bottom-2 right-2">
                    <div className="w-8 h-1 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 transition-all duration-100"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Screen Share Overlay */}
          {state.currentSession.hasScreenShare && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <Monitor className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Screen Sharing Active</h3>
                <p className="text-gray-300">
                  {state.currentSession.screenShareHost === 'current_user' 
                    ? 'You are sharing your screen' 
                    : `${state.currentSession.screenShareHost} is sharing their screen`}
                </p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-full p-2 flex items-center space-x-2">
              <button
                onClick={actions.toggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  state.audioEnabled 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {state.audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={actions.toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  state.videoEnabled 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {state.videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={state.screenShareEnabled ? actions.stopScreenShare : actions.startScreenShare}
                className={`p-3 rounded-full transition-colors ${
                  state.screenShareEnabled 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {state.screenShareEnabled ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </button>

              {state.isHost && (
                <button
                  onClick={actions.endSession}
                  className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors text-white"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setShowChat(true)}
                className={`flex-1 p-3 text-sm font-medium transition-colors ${
                  showChat ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setShowParticipants(true)}
                className={`flex-1 p-3 text-sm font-medium transition-colors ${
                  showParticipants ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Participants
              </button>
            </div>

            {/* Chat */}
            {showChat && (
              <div className="flex-1 flex flex-col">
                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
                  {state.currentSession.chatMessages.map((message) => (
                    <div key={message.id} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-300">{message.senderName}</span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.type === 'cultural_tip' && (
                          <Sparkles className="w-3 h-3 text-yellow-400" />
                        )}
                        {message.type === 'pronunciation_help' && (
                          <Headphones className="w-3 h-3 text-blue-400" />
                        )}
                      </div>
                      <div className={`text-sm p-2 rounded-lg ${
                        message.type === 'cultural_tip' 
                          ? 'bg-yellow-900/30 border border-yellow-700/50' 
                          : message.type === 'pronunciation_help'
                          ? 'bg-blue-900/30 border border-blue-700/50'
                          : 'bg-gray-700'
                      }`}>
                        {message.content}
                        {message.culturalContext && (
                          <div className="mt-2 text-xs text-gray-400 italic">
                            Cultural context: {message.culturalContext}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim()}
                      className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => actions.sendCulturalTip('', '')}
                      className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                    >
                      Cultural Tip
                    </button>
                    <button
                      onClick={() => actions.requestPronunciationHelp('')}
                      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                      Pronunciation Help
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
            {showParticipants && (
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-3">
                  {/* Host */}
                  <div className="flex items-center space-x-3 p-2 bg-gray-700 rounded-lg">
                    <img
                      src={state.currentSession.host.avatar}
                      alt={state.currentSession.host.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{state.currentSession.host.name}</span>
                        <Crown className="w-3 h-3 text-yellow-400" />
                      </div>
                      <div className="text-xs text-gray-400">Host</div>
                    </div>
                    <div className="flex space-x-1">
                      {state.currentSession.host.hasAudio ? (
                        <Mic className="w-3 h-3 text-green-400" />
                      ) : (
                        <MicOff className="w-3 h-3 text-red-400" />
                      )}
                      {state.currentSession.host.hasVideo ? (
                        <Video className="w-3 h-3 text-green-400" />
                      ) : (
                        <VideoOff className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  </div>

                  {/* Participants */}
                  {state.currentSession.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <div className="relative">
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-8 h-8 rounded-full"
                        />
                        {participant.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{participant.name}</span>
                          {participant.languageLevel && (
                            <span className="text-xs px-1 py-0.5 bg-blue-600 rounded">
                              {participant.languageLevel}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">{participant.role}</div>
                      </div>
                      <div className="flex space-x-1">
                        {participant.hasAudio ? (
                          <Mic className="w-3 h-3 text-green-400" />
                        ) : (
                          <MicOff className="w-3 h-3 text-red-400" />
                        )}
                        {participant.hasVideo ? (
                          <Video className="w-3 h-3 text-green-400" />
                        ) : (
                          <VideoOff className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* You */}
                  <div className="flex items-center space-x-3 p-2 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      You
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">You</span>
                        <span className="text-xs px-1 py-0.5 bg-blue-600 rounded">
                          {state.isHost ? 'Host' : 'Participant'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">Current user</div>
                    </div>
                    <div className="flex space-x-1">
                      {state.audioEnabled ? (
                        <Mic className="w-3 h-3 text-green-400" />
                      ) : (
                        <MicOff className="w-3 h-3 text-red-400" />
                      )}
                      {state.videoEnabled ? (
                        <Video className="w-3 h-3 text-green-400" />
                      ) : (
                        <VideoOff className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LivePractice;
export { LivePractice };