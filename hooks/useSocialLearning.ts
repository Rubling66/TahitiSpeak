'use client';

import { useState, useEffect, useCallback } from 'react';

// Types for social learning features
export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  achievements: Achievement[];
  culturalBadges: CulturalBadge[];
  languageProficiency: LanguageProficiency;
  joinDate: Date;
  lastActive: Date;
  friends: string[];
  studyGroups: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  category: 'cultural' | 'language' | 'social' | 'learning';
}

export interface CulturalBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'traditions' | 'language' | 'history' | 'arts' | 'cuisine';
  earnedAt: Date;
}

export interface LanguageProficiency {
  tahitian: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'native';
    score: number;
    vocabulary: number;
    pronunciation: number;
    grammar: number;
  };
  french: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'native';
    score: number;
  };
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: 'language' | 'culture' | 'history' | 'arts';
  level: 'beginner' | 'intermediate' | 'advanced';
  members: UserProfile[];
  maxMembers: number;
  isPrivate: boolean;
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  tags: string[];
  meetingSchedule?: {
    day: string;
    time: string;
    timezone: string;
  };
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: UserProfile;
  category: 'general' | 'culture' | 'language' | 'travel' | 'food' | 'traditions';
  tags: string[];
  likes: number;
  replies: ForumReply[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isLocked: boolean;
}

export interface ForumReply {
  id: string;
  content: string;
  author: UserProfile;
  likes: number;
  createdAt: Date;
  parentReplyId?: string;
}

export interface LanguagePartner {
  id: string;
  profile: UserProfile;
  nativeLanguage: 'tahitian' | 'french' | 'english';
  learningLanguage: 'tahitian' | 'french' | 'english';
  availability: {
    timezone: string;
    preferredTimes: string[];
    days: string[];
  };
  interests: string[];
  teachingStyle: 'casual' | 'structured' | 'conversational';
  rating: number;
  totalSessions: number;
}

export interface SocialLearningState {
  currentUser: UserProfile | null;
  studyGroups: StudyGroup[];
  forumPosts: ForumPost[];
  languagePartners: LanguagePartner[];
  friends: UserProfile[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

export interface Notification {
  id: string;
  type: 'friend_request' | 'group_invite' | 'achievement' | 'message' | 'event';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// Mock data for demonstration
const mockUserProfile: UserProfile = {
  id: 'user-1',
  name: 'Teiva Marama',
  avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20polynesian%20person%20avatar%20tropical%20background%20smiling&image_size=square',
  level: 12,
  xp: 2450,
  streak: 15,
  achievements: [
    {
      id: 'ach-1',
      name: 'Cultural Explorer',
      description: 'Completed 10 cultural lessons',
      icon: '🏝️',
      rarity: 'rare',
      unlockedAt: new Date('2024-01-15'),
      category: 'cultural'
    },
    {
      id: 'ach-2',
      name: 'Language Enthusiast',
      description: 'Practiced Tahitian for 30 days straight',
      icon: '🗣️',
      rarity: 'epic',
      unlockedAt: new Date('2024-01-20'),
      category: 'language'
    }
  ],
  culturalBadges: [
    {
      id: 'badge-1',
      name: 'Hula Master',
      description: 'Learned traditional Tahitian dance',
      icon: '💃',
      color: '#FF6B6B',
      category: 'arts',
      earnedAt: new Date('2024-01-10')
    },
    {
      id: 'badge-2',
      name: 'Poisson Cru Chef',
      description: 'Mastered traditional Tahitian cuisine',
      icon: '🐟',
      color: '#4ECDC4',
      category: 'cuisine',
      earnedAt: new Date('2024-01-18')
    }
  ],
  languageProficiency: {
    tahitian: {
      level: 'intermediate',
      score: 75,
      vocabulary: 80,
      pronunciation: 70,
      grammar: 75
    },
    french: {
      level: 'advanced',
      score: 85
    }
  },
  joinDate: new Date('2023-12-01'),
  lastActive: new Date(),
  friends: ['user-2', 'user-3'],
  studyGroups: ['group-1', 'group-2']
};

const mockStudyGroups: StudyGroup[] = [
  {
    id: 'group-1',
    name: 'Tahitian Beginners Circle',
    description: 'A welcoming group for those starting their Tahitian language journey',
    category: 'language',
    level: 'beginner',
    members: [],
    maxMembers: 15,
    isPrivate: false,
    createdBy: 'user-1',
    createdAt: new Date('2024-01-01'),
    lastActivity: new Date(),
    tags: ['tahitian', 'beginners', 'pronunciation'],
    meetingSchedule: {
      day: 'Tuesday',
      time: '19:00',
      timezone: 'Pacific/Tahiti'
    }
  },
  {
    id: 'group-2',
    name: 'Cultural Heritage Explorers',
    description: 'Dive deep into Polynesian traditions and history',
    category: 'culture',
    level: 'intermediate',
    members: [],
    maxMembers: 20,
    isPrivate: false,
    createdBy: 'user-2',
    createdAt: new Date('2024-01-05'),
    lastActivity: new Date(),
    tags: ['culture', 'traditions', 'history']
  }
];

const mockForumPosts: ForumPost[] = [
  {
    id: 'post-1',
    title: 'Best places to practice Tahitian in Papeete?',
    content: 'I\'m visiting Tahiti next month and would love to practice my Tahitian with locals. Any recommendations for cafes, markets, or cultural centers where people are welcoming to language learners?',
    author: mockUserProfile,
    category: 'travel',
    tags: ['papeete', 'practice', 'travel'],
    likes: 12,
    replies: [
      {
        id: 'reply-1',
        content: 'The Marché de Papeete is perfect! Vendors love when tourists try to speak Tahitian. Start with simple greetings like "Ia ora na!"',
        author: mockUserProfile,
        likes: 8,
        createdAt: new Date('2024-01-20')
      }
    ],
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-20'),
    isPinned: false,
    isLocked: false
  },
  {
    id: 'post-2',
    title: 'Traditional Tahitian recipes to try at home',
    content: 'I\'ve been learning about Tahitian culture and want to try cooking some traditional dishes. What are some beginner-friendly recipes that capture authentic flavors?',
    author: mockUserProfile,
    category: 'food',
    tags: ['cooking', 'recipes', 'traditional'],
    likes: 18,
    replies: [],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    isPinned: true,
    isLocked: false
  }
];

export const useSocialLearning = () => {
  const [state, setState] = useState<SocialLearningState>({
    currentUser: mockUserProfile,
    studyGroups: mockStudyGroups,
    forumPosts: mockForumPosts,
    languagePartners: [],
    friends: [],
    notifications: [],
    isLoading: false,
    error: null
  });

  // User profile management
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setState(prev => ({
      ...prev,
      currentUser: prev.currentUser ? { ...prev.currentUser, ...updates } : null
    }));
  }, []);

  const addAchievement = useCallback((achievement: Achievement) => {
    setState(prev => ({
      ...prev,
      currentUser: prev.currentUser ? {
        ...prev.currentUser,
        achievements: [...prev.currentUser.achievements, achievement]
      } : null
    }));
  }, []);

  const addCulturalBadge = useCallback((badge: CulturalBadge) => {
    setState(prev => ({
      ...prev,
      currentUser: prev.currentUser ? {
        ...prev.currentUser,
        culturalBadges: [...prev.currentUser.culturalBadges, badge]
      } : null
    }));
  }, []);

  // Study group management
  const createStudyGroup = useCallback((groupData: Omit<StudyGroup, 'id' | 'members' | 'createdAt' | 'lastActivity'>) => {
    const newGroup: StudyGroup = {
      ...groupData,
      id: `group-${Date.now()}`,
      members: state.currentUser ? [state.currentUser] : [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    setState(prev => ({
      ...prev,
      studyGroups: [...prev.studyGroups, newGroup]
    }));

    return newGroup;
  }, [state.currentUser]);

  const joinStudyGroup = useCallback((groupId: string) => {
    if (!state.currentUser) return;

    setState(prev => ({
      ...prev,
      studyGroups: prev.studyGroups.map(group =>
        group.id === groupId && group.members.length < group.maxMembers
          ? { ...group, members: [...group.members, state.currentUser!] }
          : group
      ),
      currentUser: prev.currentUser ? {
        ...prev.currentUser,
        studyGroups: [...prev.currentUser.studyGroups, groupId]
      } : null
    }));
  }, [state.currentUser]);

  const leaveStudyGroup = useCallback((groupId: string) => {
    if (!state.currentUser) return;

    setState(prev => ({
      ...prev,
      studyGroups: prev.studyGroups.map(group =>
        group.id === groupId
          ? { ...group, members: group.members.filter(member => member.id !== state.currentUser!.id) }
          : group
      ),
      currentUser: prev.currentUser ? {
        ...prev.currentUser,
        studyGroups: prev.currentUser.studyGroups.filter(id => id !== groupId)
      } : null
    }));
  }, [state.currentUser]);

  // Forum management
  const createForumPost = useCallback((postData: Omit<ForumPost, 'id' | 'author' | 'likes' | 'replies' | 'createdAt' | 'updatedAt' | 'isPinned' | 'isLocked'>) => {
    if (!state.currentUser) return;

    const newPost: ForumPost = {
      ...postData,
      id: `post-${Date.now()}`,
      author: state.currentUser,
      likes: 0,
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
      isLocked: false
    };

    setState(prev => ({
      ...prev,
      forumPosts: [newPost, ...prev.forumPosts]
    }));

    return newPost;
  }, [state.currentUser]);

  const likeForumPost = useCallback((postId: string) => {
    setState(prev => ({
      ...prev,
      forumPosts: prev.forumPosts.map(post =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    }));
  }, []);

  const replyToPost = useCallback((postId: string, content: string, parentReplyId?: string) => {
    if (!state.currentUser) return;

    const newReply: ForumReply = {
      id: `reply-${Date.now()}`,
      content,
      author: state.currentUser,
      likes: 0,
      createdAt: new Date(),
      parentReplyId
    };

    setState(prev => ({
      ...prev,
      forumPosts: prev.forumPosts.map(post =>
        post.id === postId
          ? { ...post, replies: [...post.replies, newReply], updatedAt: new Date() }
          : post
      )
    }));

    return newReply;
  }, [state.currentUser]);

  // Friend management
  const sendFriendRequest = useCallback((userId: string) => {
    // In a real app, this would send a request to the backend
    console.log(`Friend request sent to user ${userId}`);
  }, []);

  const acceptFriendRequest = useCallback((userId: string) => {
    setState(prev => ({
      ...prev,
      currentUser: prev.currentUser ? {
        ...prev.currentUser,
        friends: [...prev.currentUser.friends, userId]
      } : null
    }));
  }, []);

  // Language partner matching
  const findLanguagePartners = useCallback((preferences: {
    nativeLanguage: string;
    learningLanguage: string;
    availability?: any;
  }) => {
    // Mock language partners based on preferences
    const mockPartners: LanguagePartner[] = [
      {
        id: 'partner-1',
        profile: {
          ...mockUserProfile,
          id: 'partner-1',
          name: 'Moana Terehia',
          avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20tahitian%20woman%20traditional%20dress%20smiling&image_size=square'
        },
        nativeLanguage: 'tahitian',
        learningLanguage: 'english',
        availability: {
          timezone: 'Pacific/Tahiti',
          preferredTimes: ['morning', 'evening'],
          days: ['monday', 'wednesday', 'friday']
        },
        interests: ['culture', 'music', 'cooking'],
        teachingStyle: 'conversational',
        rating: 4.8,
        totalSessions: 45
      }
    ];

    setState(prev => ({
      ...prev,
      languagePartners: mockPartners
    }));

    return mockPartners;
  }, []);

  // Notification management
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date(),
      isRead: false
    };

    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications]
    }));
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    }));
  }, []);

  // Initialize with mock data
  useEffect(() => {
    // Simulate loading
    setState(prev => ({ ...prev, isLoading: true }));
    
    setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    }, 1000);
  }, []);

  return {
    ...state,
    // Profile actions
    updateProfile,
    addAchievement,
    addCulturalBadge,
    // Study group actions
    createStudyGroup,
    joinStudyGroup,
    leaveStudyGroup,
    // Forum actions
    createForumPost,
    likeForumPost,
    replyToPost,
    // Friend actions
    sendFriendRequest,
    acceptFriendRequest,
    // Language partner actions
    findLanguagePartners,
    // Notification actions
    addNotification,
    markNotificationAsRead
  };
};