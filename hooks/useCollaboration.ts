'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Types for real-time collaboration
export interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'participant' | 'observer';
  isOnline: boolean;
  isSpeaking: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  joinedAt: Date;
  culturalBackground?: string;
  languageLevel?: 'beginner' | 'intermediate' | 'advanced' | 'native';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'audio' | 'image' | 'cultural_tip' | 'pronunciation_help';
  timestamp: Date;
  isTranslated?: boolean;
  originalLanguage?: string;
  culturalContext?: string;
}

export interface CollaborationSession {
  id: string;
  title: string;
  description: string;
  type: 'language_practice' | 'cultural_workshop' | 'study_group' | 'virtual_tour' | 'cooking_class' | 'dance_lesson';
  host: Participant;
  participants: Participant[];
  maxParticipants: number;
  startTime: Date;
  endTime?: Date;
  isRecording: boolean;
  language: 'tahitian' | 'french' | 'english';
  culturalFocus: string;
  status: 'waiting' | 'active' | 'ended';
  hasScreenShare: boolean;
  screenShareHost?: string;
  chatMessages: ChatMessage[];
  culturalInsights: string[];
}

export interface VirtualEvent {
  id: string;
  title: string;
  description: string;
  type: 'live_workshop' | 'virtual_tour' | 'guest_speaker' | 'cultural_celebration' | 'cooking_demo' | 'dance_performance';
  host: string;
  hostAvatar: string;
  startTime: Date;
  duration: number; // in minutes
  maxAttendees: number;
  currentAttendees: number;
  isLive: boolean;
  streamUrl?: string;
  culturalTopic: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  thumbnail: string;
  isRegistered: boolean;
  hasRecording: boolean;
  recordingUrl?: string;
  culturalContext: string;
  materials?: string[];
  prerequisites?: string[];
}

export interface CollaborationState {
  currentSession: CollaborationSession | null;
  availableSessions: CollaborationSession[];
  upcomingEvents: VirtualEvent[];
  liveEvents: VirtualEvent[];
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  audioLevel: number;
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenShareEnabled: boolean;
  isHost: boolean;
  notifications: Array<{
    id: string;
    type: 'session_invite' | 'event_reminder' | 'cultural_tip' | 'pronunciation_feedback';
    message: string;
    timestamp: Date;
    isRead: boolean;
  }>;
  culturalTips: Array<{
    id: string;
    tip: string;
    context: string;
    category: 'language' | 'etiquette' | 'tradition' | 'pronunciation';
    timestamp: Date;
  }>;
}

export interface UseCollaborationReturn {
  state: CollaborationState;
  actions: {
    // Session Management
    createSession: (sessionData: Partial<CollaborationSession>) => Promise<void>;
    joinSession: (sessionId: string) => Promise<void>;
    leaveSession: () => void;
    endSession: () => void;
    
    // Media Controls
    toggleVideo: () => void;
    toggleAudio: () => void;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => void;
    
    // Chat & Communication
    sendMessage: (content: string, type?: ChatMessage['type']) => void;
    sendCulturalTip: (tip: string, context: string) => void;
    requestPronunciationHelp: (word: string) => void;
    
    // Event Management
    registerForEvent: (eventId: string) => Promise<void>;
    unregisterFromEvent: (eventId: string) => Promise<void>;
    joinLiveEvent: (eventId: string) => Promise<void>;
    
    // Collaboration Features
    inviteParticipant: (userId: string) => Promise<void>;
    promoteToHost: (participantId: string) => void;
    removeParticipant: (participantId: string) => void;
    
    // Cultural Features
    shareCulturalInsight: (insight: string) => void;
    requestTranslation: (text: string, targetLanguage: string) => Promise<string>;
    providePronunciationFeedback: (participantId: string, feedback: string) => void;
    
    // Utility
    refreshSessions: () => Promise<void>;
    refreshEvents: () => Promise<void>;
    markNotificationAsRead: (notificationId: string) => void;
    clearNotifications: () => void;
  };
}

// Mock data for development
const mockSessions: CollaborationSession[] = [
  {
    id: '1',
    title: 'Tahitian Pronunciation Practice',
    description: 'Practice proper pronunciation of common Tahitian phrases with native speakers',
    type: 'language_practice',
    host: {
      id: 'host1',
      name: 'Teiva Raapoto',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20man%20teacher%20traditional%20setting&image_size=square',
      role: 'host',
      isOnline: true,
      isSpeaking: false,
      hasVideo: true,
      hasAudio: true,
      joinedAt: new Date(),
      culturalBackground: 'Native Tahitian',
      languageLevel: 'native'
    },
    participants: [
      {
        id: 'p1',
        name: 'Sarah Johnson',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=young%20woman%20student%20learning&image_size=square',
        role: 'participant',
        isOnline: true,
        isSpeaking: false,
        hasVideo: true,
        hasAudio: true,
        joinedAt: new Date(Date.now() - 300000),
        languageLevel: 'beginner'
      },
      {
        id: 'p2',
        name: 'Marc Dubois',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=middle%20aged%20man%20student%20enthusiastic&image_size=square',
        role: 'participant',
        isOnline: true,
        isSpeaking: true,
        hasVideo: false,
        hasAudio: true,
        joinedAt: new Date(Date.now() - 600000),
        languageLevel: 'intermediate'
      }
    ],
    maxParticipants: 8,
    startTime: new Date(Date.now() - 900000),
    isRecording: true,
    language: 'tahitian',
    culturalFocus: 'Traditional greetings and daily expressions',
    status: 'active',
    hasScreenShare: false,
    chatMessages: [
      {
        id: 'msg1',
        senderId: 'host1',
        senderName: 'Teiva Raapoto',
        content: 'Ia ora na! Welcome everyone to our pronunciation practice session.',
        type: 'text',
        timestamp: new Date(Date.now() - 600000)
      },
      {
        id: 'msg2',
        senderId: 'p1',
        senderName: 'Sarah Johnson',
        content: 'Thank you! I\'m excited to learn proper pronunciation.',
        type: 'text',
        timestamp: new Date(Date.now() - 580000)
      },
      {
        id: 'msg3',
        senderId: 'host1',
        senderName: 'Teiva Raapoto',
        content: 'Remember: "Ia ora na" is pronounced "ee-ah OH-rah nah" - the stress is on the second syllable of "ora"',
        type: 'cultural_tip',
        timestamp: new Date(Date.now() - 300000),
        culturalContext: 'Traditional Tahitian greeting used throughout the day'
      }
    ],
    culturalInsights: [
      'In Tahitian culture, proper pronunciation shows respect for the language and ancestors',
      'The letter "r" in Tahitian is rolled, similar to Spanish',
      'Tahitian has only 13 letters in its alphabet'
    ]
  },
  {
    id: '2',
    title: 'Virtual Marae Tour',
    description: 'Explore ancient Polynesian temples and learn about their cultural significance',
    type: 'virtual_tour',
    host: {
      id: 'host2',
      name: 'Dr. Hinano Teriipaia',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20woman%20archaeologist%20professional&image_size=square',
      role: 'host',
      isOnline: true,
      isSpeaking: false,
      hasVideo: true,
      hasAudio: true,
      joinedAt: new Date(),
      culturalBackground: 'Cultural Historian',
      languageLevel: 'native'
    },
    participants: [],
    maxParticipants: 20,
    startTime: new Date(Date.now() + 1800000), // 30 minutes from now
    language: 'english',
    culturalFocus: 'Ancient Polynesian religious sites and practices',
    status: 'waiting',
    hasScreenShare: true,
    chatMessages: [],
    culturalInsights: []
  }
];

const mockEvents: VirtualEvent[] = [
  {
    id: '1',
    title: 'Traditional Tahitian Cooking: Poisson Cru',
    description: 'Learn to prepare the iconic Tahitian dish with fresh fish and coconut milk',
    type: 'cooking_demo',
    host: 'Chef Moana Sinclair',
    hostAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20chef%20woman%20traditional%20kitchen&image_size=square',
    startTime: new Date(Date.now() + 3600000), // 1 hour from now
    duration: 90,
    maxAttendees: 50,
    currentAttendees: 32,
    isLive: false,
    culturalTopic: 'Traditional Polynesian Cuisine',
    language: 'English with Tahitian terms',
    difficulty: 'beginner',
    tags: ['cooking', 'traditional', 'seafood', 'coconut'],
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20tahitian%20poisson%20cru%20dish%20coconut%20lime&image_size=landscape_16_9',
    isRegistered: true,
    hasRecording: true,
    culturalContext: 'Poisson cru is considered the national dish of Tahiti, representing the harmony between land and sea in Polynesian culture.',
    materials: ['Fresh fish (mahi-mahi or tuna)', 'Coconut milk', 'Lime juice', 'Vegetables', 'Traditional serving bowl'],
    prerequisites: ['Basic knife skills', 'Access to fresh ingredients']
  },
  {
    id: '2',
    title: 'Ori Tahiti Dance Workshop',
    description: 'Master the graceful movements of traditional Tahitian dance',
    type: 'dance_performance',
    host: 'Tiare Manu',
    hostAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20woman%20dancer%20traditional%20costume&image_size=square',
    startTime: new Date(Date.now() + 7200000), // 2 hours from now
    duration: 120,
    maxAttendees: 30,
    currentAttendees: 18,
    isLive: false,
    culturalTopic: 'Traditional Polynesian Dance',
    language: 'Tahitian with English translation',
    difficulty: 'intermediate',
    tags: ['dance', 'culture', 'movement', 'music'],
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=tahitian%20dancers%20traditional%20costumes%20tropical%20setting&image_size=landscape_16_9',
    isRegistered: false,
    hasRecording: true,
    culturalContext: 'Ori Tahiti tells stories of gods, nature, and daily life through expressive hip movements and hand gestures.',
    materials: ['Comfortable clothing', 'Pareo (traditional wrap)', 'Water bottle'],
    prerequisites: ['Basic physical fitness', 'Respect for cultural traditions']
  },
  {
    id: '3',
    title: 'Live from Moorea: Sunset Cultural Ceremony',
    description: 'Experience a traditional Polynesian blessing ceremony at sunset',
    type: 'cultural_celebration',
    host: 'Elder Tauira Temarii',
    hostAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20elder%20traditional%20ceremony%20sunset&image_size=square',
    startTime: new Date(Date.now() + 10800000), // 3 hours from now
    duration: 60,
    maxAttendees: 100,
    currentAttendees: 67,
    isLive: true,
    streamUrl: 'https://stream.example.com/moorea-ceremony',
    culturalTopic: 'Traditional Blessing Ceremonies',
    language: 'Tahitian with live translation',
    difficulty: 'beginner',
    tags: ['ceremony', 'spiritual', 'sunset', 'blessing'],
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=polynesian%20ceremony%20sunset%20moorea%20island%20spiritual&image_size=landscape_16_9',
    isRegistered: true,
    hasRecording: false,
    culturalContext: 'Sunset ceremonies honor the transition from day to night and seek blessings from ancestral spirits.',
    materials: ['Quiet space for reflection', 'Optional: white flower or shell for offering'],
    prerequisites: ['Respectful attitude', 'Cultural sensitivity']
  }
];

export const useCollaboration = (): UseCollaborationReturn => {
  const [state, setState] = useState<CollaborationState>({
    currentSession: null,
    availableSessions: mockSessions,
    upcomingEvents: mockEvents.filter(e => !e.isLive),
    liveEvents: mockEvents.filter(e => e.isLive),
    isConnected: false,
    connectionQuality: 'good',
    audioLevel: 0,
    videoEnabled: false,
    audioEnabled: false,
    screenShareEnabled: false,
    isHost: false,
    notifications: [
      {
        id: '1',
        type: 'session_invite',
        message: 'Teiva Raapoto invited you to join "Tahitian Pronunciation Practice"',
        timestamp: new Date(Date.now() - 300000),
        isRead: false
      },
      {
        id: '2',
        type: 'event_reminder',
        message: 'Traditional Tahitian Cooking starts in 1 hour',
        timestamp: new Date(Date.now() - 180000),
        isRead: false
      },
      {
        id: '3',
        type: 'cultural_tip',
        message: 'New cultural insight: The importance of "mana" in Polynesian culture',
        timestamp: new Date(Date.now() - 600000),
        isRead: true
      }
    ],
    culturalTips: [
      {
        id: '1',
        tip: 'When greeting elders, always use "Ia ora na" with a slight bow of the head',
        context: 'Shows respect for age and wisdom in Polynesian culture',
        category: 'etiquette',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: '2',
        tip: 'The "r" sound in Tahitian is rolled, similar to Spanish pronunciation',
        context: 'Essential for proper pronunciation of Tahitian words',
        category: 'pronunciation',
        timestamp: new Date(Date.now() - 7200000)
      },
      {
        id: '3',
        tip: 'Sharing food is a sacred act in Polynesian culture - always offer to share',
        context: 'Reflects the concept of "ohana" (family) extending to all community members',
        category: 'tradition',
        timestamp: new Date(Date.now() - 10800000)
      }
    ]
  });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Simulate audio level monitoring
  useEffect(() => {
    if (state.audioEnabled && state.currentSession) {
      const interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          audioLevel: Math.random() * 100
        }));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [state.audioEnabled, state.currentSession]);

  // Session Management
  const createSession = useCallback(async (sessionData: Partial<CollaborationSession>) => {
    const newSession: CollaborationSession = {
      id: Date.now().toString(),
      title: sessionData.title || 'New Session',
      description: sessionData.description || '',
      type: sessionData.type || 'language_practice',
      host: {
        id: 'current_user',
        name: 'You',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20person%20avatar&image_size=square',
        role: 'host',
        isOnline: true,
        isSpeaking: false,
        hasVideo: false,
        hasAudio: false,
        joinedAt: new Date()
      },
      participants: [],
      maxParticipants: sessionData.maxParticipants || 10,
      startTime: new Date(),
      isRecording: false,
      language: sessionData.language || 'tahitian',
      culturalFocus: sessionData.culturalFocus || '',
      status: 'active',
      hasScreenShare: false,
      chatMessages: [],
      culturalInsights: []
    };

    setState(prev => ({
      ...prev,
      currentSession: newSession,
      isHost: true,
      isConnected: true,
      availableSessions: [...prev.availableSessions, newSession]
    }));
  }, []);

  const joinSession = useCallback(async (sessionId: string) => {
    const session = state.availableSessions.find(s => s.id === sessionId);
    if (session && session.participants.length < session.maxParticipants) {
      const updatedSession = {
        ...session,
        participants: [
          ...session.participants,
          {
            id: 'current_user',
            name: 'You',
            avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20person%20avatar&image_size=square',
            role: 'participant' as const,
            isOnline: true,
            isSpeaking: false,
            hasVideo: false,
            hasAudio: false,
            joinedAt: new Date()
          }
        ]
      };

      setState(prev => ({
        ...prev,
        currentSession: updatedSession,
        isConnected: true,
        isHost: false
      }));
    }
  }, [state.availableSessions]);

  const leaveSession = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setState(prev => ({
      ...prev,
      currentSession: null,
      isConnected: false,
      isHost: false,
      videoEnabled: false,
      audioEnabled: false,
      screenShareEnabled: false
    }));
  }, []);

  const endSession = useCallback(() => {
    if (state.isHost && state.currentSession) {
      setState(prev => ({
        ...prev,
        currentSession: { ...prev.currentSession!, status: 'ended' },
        availableSessions: prev.availableSessions.map(s => 
          s.id === prev.currentSession?.id ? { ...s, status: 'ended' } : s
        )
      }));
      
      setTimeout(() => {
        leaveSession();
      }, 2000);
    }
  }, [state.isHost, state.currentSession, leaveSession]);

  // Media Controls
  const toggleVideo = useCallback(async () => {
    try {
      if (!state.videoEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: state.audioEnabled });
        mediaStreamRef.current = stream;
      } else {
        if (mediaStreamRef.current) {
          const videoTracks = mediaStreamRef.current.getVideoTracks();
          videoTracks.forEach(track => track.stop());
        }
      }

      setState(prev => ({
        ...prev,
        videoEnabled: !prev.videoEnabled
      }));
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  }, [state.videoEnabled, state.audioEnabled]);

  const toggleAudio = useCallback(async () => {
    try {
      if (!state.audioEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: state.videoEnabled });
        mediaStreamRef.current = stream;
      } else {
        if (mediaStreamRef.current) {
          const audioTracks = mediaStreamRef.current.getAudioTracks();
          audioTracks.forEach(track => track.stop());
        }
      }

      setState(prev => ({
        ...prev,
        audioEnabled: !prev.audioEnabled
      }));
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  }, [state.audioEnabled, state.videoEnabled]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setState(prev => ({
        ...prev,
        screenShareEnabled: true,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          hasScreenShare: true,
          screenShareHost: 'current_user'
        } : null
      }));
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    setState(prev => ({
      ...prev,
      screenShareEnabled: false,
      currentSession: prev.currentSession ? {
        ...prev.currentSession,
        hasScreenShare: false,
        screenShareHost: undefined
      } : null
    }));
  }, []);

  // Chat & Communication
  const sendMessage = useCallback((content: string, type: ChatMessage['type'] = 'text') => {
    if (state.currentSession) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'current_user',
        senderName: 'You',
        content,
        type,
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          chatMessages: [...prev.currentSession.chatMessages, newMessage]
        } : null
      }));
    }
  }, [state.currentSession]);

  const sendCulturalTip = useCallback((tip: string, context: string) => {
    const newTip = {
      id: Date.now().toString(),
      tip,
      context,
      category: 'tradition' as const,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      culturalTips: [newTip, ...prev.culturalTips]
    }));

    sendMessage(`Cultural Tip: ${tip}`, 'cultural_tip');
  }, [sendMessage]);

  const requestPronunciationHelp = useCallback((word: string) => {
    sendMessage(`Could someone help me pronounce "${word}" correctly?`, 'pronunciation_help');
  }, [sendMessage]);

  // Event Management
  const registerForEvent = useCallback(async (eventId: string) => {
    setState(prev => ({
      ...prev,
      upcomingEvents: prev.upcomingEvents.map(event =>
        event.id === eventId
          ? { ...event, isRegistered: true, currentAttendees: event.currentAttendees + 1 }
          : event
      )
    }));
  }, []);

  const unregisterFromEvent = useCallback(async (eventId: string) => {
    setState(prev => ({
      ...prev,
      upcomingEvents: prev.upcomingEvents.map(event =>
        event.id === eventId
          ? { ...event, isRegistered: false, currentAttendees: Math.max(0, event.currentAttendees - 1) }
          : event
      )
    }));
  }, []);

  const joinLiveEvent = useCallback(async (eventId: string) => {
    const event = state.liveEvents.find(e => e.id === eventId);
    if (event && event.streamUrl) {
      // In a real implementation, this would open the stream
      console.log('Joining live event:', event.title, 'Stream URL:', event.streamUrl);
    }
  }, [state.liveEvents]);

  // Collaboration Features
  const inviteParticipant = useCallback(async (userId: string) => {
    // In a real implementation, this would send an invitation
    console.log('Inviting participant:', userId);
  }, []);

  const promoteToHost = useCallback((participantId: string) => {
    if (state.isHost && state.currentSession) {
      setState(prev => ({
        ...prev,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          participants: prev.currentSession.participants.map(p =>
            p.id === participantId ? { ...p, role: 'host' } : p
          )
        } : null
      }));
    }
  }, [state.isHost, state.currentSession]);

  const removeParticipant = useCallback((participantId: string) => {
    if (state.isHost && state.currentSession) {
      setState(prev => ({
        ...prev,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          participants: prev.currentSession.participants.filter(p => p.id !== participantId)
        } : null
      }));
    }
  }, [state.isHost, state.currentSession]);

  // Cultural Features
  const shareCulturalInsight = useCallback((insight: string) => {
    if (state.currentSession) {
      setState(prev => ({
        ...prev,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          culturalInsights: [...prev.currentSession.culturalInsights, insight]
        } : null
      }));
    }
  }, [state.currentSession]);

  const requestTranslation = useCallback(async (text: string, targetLanguage: string): Promise<string> => {
    // Mock translation - in real implementation, this would call a translation API
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `[Translated to ${targetLanguage}]: ${text}`;
  }, []);

  const providePronunciationFeedback = useCallback((participantId: string, feedback: string) => {
    sendMessage(`@${participantId}: ${feedback}`, 'pronunciation_help');
  }, [sendMessage]);

  // Utility Functions
  const refreshSessions = useCallback(async () => {
    // In a real implementation, this would fetch fresh data from the server
    setState(prev => ({
      ...prev,
      availableSessions: mockSessions
    }));
  }, []);

  const refreshEvents = useCallback(async () => {
    // In a real implementation, this would fetch fresh data from the server
    setState(prev => ({
      ...prev,
      upcomingEvents: mockEvents.filter(e => !e.isLive),
      liveEvents: mockEvents.filter(e => e.isLive)
    }));
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: []
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  return {
    state,
    actions: {
      createSession,
      joinSession,
      leaveSession,
      endSession,
      toggleVideo,
      toggleAudio,
      startScreenShare,
      stopScreenShare,
      sendMessage,
      sendCulturalTip,
      requestPronunciationHelp,
      registerForEvent,
      unregisterFromEvent,
      joinLiveEvent,
      inviteParticipant,
      promoteToHost,
      removeParticipant,
      shareCulturalInsight,
      requestTranslation,
      providePronunciationFeedback,
      refreshSessions,
      refreshEvents,
      markNotificationAsRead,
      clearNotifications
    }
  };
};