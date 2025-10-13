'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Globe, 
  Star, 
  UserPlus, 
  MessageCircle, 
  Video,
  BookOpen,
  Award,
  Settings,
  MapPin,
  Heart,
  Eye,
  TrendingUp,
  Crown,
  Shield,
  Zap
} from 'lucide-react';
import { useSocialLearning, StudyGroup, LanguagePartner } from '@/hooks/useSocialLearning';

interface StudyGroupsProps {
  onClose?: () => void;
}

const StudyGroups: React.FC<StudyGroupsProps> = ({ onClose }) => {
  const { 
    studyGroups, 
    languagePartners,
    currentUser,
    createStudyGroup, 
    joinStudyGroup, 
    leaveStudyGroup,
    findLanguagePartners
  } = useSocialLearning();
  
  const [activeTab, setActiveTab] = useState<'groups' | 'partners' | 'my-groups'>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    category: 'language' as StudyGroup['category'],
    level: 'beginner' as StudyGroup['level'],
    maxMembers: 15,
    isPrivate: false,
    tags: [] as string[],
    meetingSchedule: {
      day: '',
      time: '',
      timezone: 'Pacific/Tahiti'
    }
  });

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🌺' },
    { id: 'language', name: 'Language Learning', icon: '🗣️' },
    { id: 'culture', name: 'Cultural Studies', icon: '🏝️' },
    { id: 'history', name: 'History & Heritage', icon: '📚' },
    { id: 'arts', name: 'Arts & Crafts', icon: '🎨' }
  ];

  const levels = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ];

  const filteredGroups = studyGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLevel = filterLevel === 'all' || group.level === filterLevel;
    const matchesCategory = filterCategory === 'all' || group.category === filterCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const myGroups = studyGroups.filter(group => 
    currentUser?.studyGroups.includes(group.id)
  );

  const handleCreateGroup = () => {
    if (!newGroupData.name.trim() || !newGroupData.description.trim()) return;

    createStudyGroup({
      name: newGroupData.name,
      description: newGroupData.description,
      category: newGroupData.category,
      level: newGroupData.level,
      maxMembers: newGroupData.maxMembers,
      isPrivate: newGroupData.isPrivate,
      createdBy: currentUser?.id || '',
      tags: newGroupData.tags,
      meetingSchedule: newGroupData.meetingSchedule.day ? newGroupData.meetingSchedule : undefined
    });

    setNewGroupData({
      name: '',
      description: '',
      category: 'language',
      level: 'beginner',
      maxMembers: 15,
      isPrivate: false,
      tags: [],
      meetingSchedule: {
        day: '',
        time: '',
        timezone: 'Pacific/Tahiti'
      }
    });
    setShowCreateGroup(false);
  };

  const handleJoinGroup = (groupId: string) => {
    joinStudyGroup(groupId);
  };

  const handleLeaveGroup = (groupId: string) => {
    leaveStudyGroup(groupId);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'language': return '🗣️';
      case 'culture': return '🏝️';
      case 'history': return '📚';
      case 'arts': return '🎨';
      default: return '🌺';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-6xl mx-auto h-[80vh] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Study Groups & Language Partners</h1>
              <p className="text-purple-100">Learn together, grow together</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </button>
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
            { id: 'groups', label: 'All Groups', icon: Users },
            { id: 'partners', label: 'Language Partners', icon: MessageCircle },
            { id: 'my-groups', label: 'My Groups', icon: BookOpen }
          ].map((tab) => {
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
                {tab.id === 'my-groups' && (
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                    {myGroups.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Groups</span>
                <span className="font-medium">{studyGroups.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">My Groups</span>
                <span className="font-medium">{myGroups.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Partners</span>
                <span className="font-medium">{languagePartners.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'groups' && (
              <motion.div
                key="groups"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Study Groups ({filteredGroups.length})</h2>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm">Popular</button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">Recent</button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">Active</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredGroups.map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getCategoryIcon(group.category)}</div>
                          <div>
                            <h3 className="font-semibold text-lg">{group.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${getLevelColor(group.level)}`}>
                                {group.level}
                              </span>
                              <span className="text-xs text-gray-500 capitalize">{group.category}</span>
                            </div>
                          </div>
                        </div>
                        {group.isPrivate && <Shield className="w-4 h-4 text-yellow-500" />}
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{group.members.length}/{group.maxMembers}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeAgo(group.lastActivity)}</span>
                        </div>
                        {group.meetingSchedule && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{group.meetingSchedule.day}s</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {group.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {group.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{group.tags.length - 3}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {group.members.slice(0, 4).map((member, index) => (
                            <img
                              key={index}
                              src={member.avatar}
                              alt={member.name}
                              className="w-6 h-6 rounded-full border-2 border-white"
                            />
                          ))}
                          {group.members.length > 4 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                              +{group.members.length - 4}
                            </div>
                          )}
                        </div>

                        {currentUser?.studyGroups.includes(group.id) ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedGroup(group)}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleLeaveGroup(group.id)}
                              className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition-colors"
                            >
                              Leave
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleJoinGroup(group.id)}
                            disabled={group.members.length >= group.maxMembers}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Join</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredGroups.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
                    <p className="text-gray-500 mb-4">
                      Try adjusting your search or create a new group
                    </p>
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Group
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'partners' && (
              <motion.div
                key="partners"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Language Partners</h2>
                  <button
                    onClick={() => findLanguagePartners({ nativeLanguage: 'english', learningLanguage: 'tahitian' })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Find Partners</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {languagePartners.map((partner, index) => (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
                    >
                      <div className="text-center mb-4">
                        <img
                          src={partner.profile.avatar}
                          alt={partner.profile.name}
                          className="w-16 h-16 rounded-full mx-auto mb-3"
                        />
                        <h3 className="font-semibold text-lg">{partner.profile.name}</h3>
                        <div className="flex items-center justify-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">{partner.rating}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-600">{partner.totalSessions} sessions</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Native:</span>
                          <span className="font-medium capitalize">{partner.nativeLanguage}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Learning:</span>
                          <span className="font-medium capitalize">{partner.learningLanguage}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Style:</span>
                          <span className="font-medium capitalize">{partner.teachingStyle}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Interests:</p>
                        <div className="flex flex-wrap gap-1">
                          {partner.interests.map((interest, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                          <MessageCircle className="w-4 h-4" />
                          <span>Message</span>
                        </button>
                        <button className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                          <Video className="w-4 h-4" />
                          <span>Call</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {languagePartners.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No language partners found</h3>
                    <p className="text-gray-500 mb-4">
                      Click "Find Partners" to discover language exchange opportunities
                    </p>
                    <button
                      onClick={() => findLanguagePartners({ nativeLanguage: 'english', learningLanguage: 'tahitian' })}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Find Language Partners
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'my-groups' && (
              <motion.div
                key="my-groups"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">My Study Groups ({myGroups.length})</h2>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Group</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myGroups.map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-blue-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getCategoryIcon(group.category)}</div>
                          <div>
                            <h3 className="font-semibold text-lg">{group.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${getLevelColor(group.level)}`}>
                                {group.level}
                              </span>
                              {group.createdBy === currentUser?.id && (
                                <Crown className="w-4 h-4 text-yellow-500" title="Group Owner" />
                              )}
                            </div>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                          <Settings className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">{group.description}</p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{group.members.length} members</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>Active</span>
                          </div>
                        </div>
                        {group.meetingSchedule && (
                          <div className="text-xs text-gray-500">
                            Next: {group.meetingSchedule.day} {group.meetingSchedule.time}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedGroup(group)}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Open Group
                        </button>
                        <button className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                          <Video className="w-4 h-4" />
                        </button>
                        <button className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {myGroups.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No study groups yet</h3>
                    <p className="text-gray-500 mb-4">
                      Join existing groups or create your own to start learning together
                    </p>
                    <div className="flex space-x-3 justify-center">
                      <button
                        onClick={() => setActiveTab('groups')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Browse Groups
                      </button>
                      <button
                        onClick={() => setShowCreateGroup(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Create Group
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
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
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Create Study Group</h2>
                  <button
                    onClick={() => setShowCreateGroup(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                    <input
                      type="text"
                      value={newGroupData.name}
                      onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Tahitian Conversation Circle"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={newGroupData.category}
                        onChange={(e) => setNewGroupData(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.slice(1).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select
                        value={newGroupData.level}
                        onChange={(e) => setNewGroupData(prev => ({ ...prev, level: e.target.value as any }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {levels.slice(1).map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newGroupData.description}
                      onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your group's purpose and what members can expect..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Members</label>
                      <input
                        type="number"
                        value={newGroupData.maxMembers}
                        onChange={(e) => setNewGroupData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 15 }))}
                        min="5"
                        max="50"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center space-x-3 pt-8">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        checked={newGroupData.isPrivate}
                        onChange={(e) => setNewGroupData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700">
                        Private Group
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowCreateGroup(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateGroup}
                      disabled={!newGroupData.name.trim() || !newGroupData.description.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Create Group
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudyGroups;
export { StudyGroups };