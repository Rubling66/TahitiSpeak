'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Heart, 
  Reply, 
  Share2, 
  Pin, 
  Lock, 
  Eye,
  Clock,
  User,
  Tag,
  TrendingUp,
  Star,
  Flag,
  MoreHorizontal,
  Send,
  Image,
  Paperclip,
  Smile
} from 'lucide-react';
import { useSocialLearning, ForumPost, ForumReply } from '@/hooks/useSocialLearning';

interface CommunityForumProps {
  onClose?: () => void;
}

const CommunityForum: React.FC<CommunityForumProps> = ({ onClose }) => {
  const { 
    forumPosts, 
    createForumPost, 
    likeForumPost, 
    replyToPost, 
    currentUser 
  } = useSocialLearning();
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [newPostData, setNewPostData] = useState({
    title: '',
    content: '',
    category: 'general' as ForumPost['category'],
    tags: [] as string[]
  });
  const [replyContent, setReplyContent] = useState('');
  const [tagInput, setTagInput] = useState('');

  const categories = [
    { id: 'all', name: 'All Posts', icon: '🌺', color: 'bg-blue-500' },
    { id: 'general', name: 'General', icon: '💬', color: 'bg-gray-500' },
    { id: 'culture', name: 'Culture', icon: '🏝️', color: 'bg-green-500' },
    { id: 'language', name: 'Language', icon: '🗣️', color: 'bg-blue-500' },
    { id: 'travel', name: 'Travel', icon: '✈️', color: 'bg-purple-500' },
    { id: 'food', name: 'Food', icon: '🥥', color: 'bg-orange-500' },
    { id: 'traditions', name: 'Traditions', icon: '🌸', color: 'bg-pink-500' }
  ];

  const filteredPosts = forumPosts.filter(post => {
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.likes - a.likes;
      case 'trending':
        return (b.likes + b.replies.length) - (a.likes + a.replies.length);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleCreatePost = () => {
    if (!newPostData.title.trim() || !newPostData.content.trim()) return;

    createForumPost({
      title: newPostData.title,
      content: newPostData.content,
      category: newPostData.category,
      tags: newPostData.tags
    });

    setNewPostData({
      title: '',
      content: '',
      category: 'general',
      tags: []
    });
    setShowCreatePost(false);
  };

  const handleReply = (postId: string) => {
    if (!replyContent.trim()) return;

    replyToPost(postId, replyContent);
    setReplyContent('');
  };

  const addTag = () => {
    if (tagInput.trim() && !newPostData.tags.includes(tagInput.trim())) {
      setNewPostData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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
      <div className="bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Community Forum</h1>
              <p className="text-blue-100">Connect, share, and learn together</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Post</span>
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="trending">Trending</option>
            </select>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Forum Stats */}
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Forum Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Posts</span>
                <span className="font-medium">{forumPosts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Today's Posts</span>
                <span className="font-medium">12</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPost ? (
            /* Post Detail View */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                  onClick={() => setSelectedPost(null)}
                  className="mb-4 text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                >
                  <span>←</span>
                  <span>Back to forum</span>
                </button>

                {/* Post Content */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={selectedPost.author.avatar}
                      alt={selectedPost.author.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h2 className="text-xl font-bold">{selectedPost.title}</h2>
                        {selectedPost.isPinned && <Pin className="w-4 h-4 text-yellow-500" />}
                        {selectedPost.isLocked && <Lock className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <span className="font-medium">{selectedPost.author.name}</span>
                        <span>{formatTimeAgo(selectedPost.createdAt)}</span>
                        <span className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>234 views</span>
                        </span>
                      </div>
                      <div className="prose max-w-none mb-4">
                        <p className="text-gray-700 leading-relaxed">{selectedPost.content}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex space-x-2">
                          {selectedPost.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => likeForumPost(selectedPost.id)}
                          className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span>{selectedPost.likes}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                          <Reply className="w-4 h-4" />
                          <span>{selectedPost.replies.length} replies</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Replies ({selectedPost.replies.length})
                  </h3>
                  
                  {selectedPost.replies.map((reply, index) => (
                    <motion.div
                      key={reply.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={reply.author.avatar}
                          alt={reply.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{reply.author.name}</span>
                            <span className="text-xs text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{reply.content}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
                              <Heart className="w-3 h-3" />
                              <span>{reply.likes}</span>
                            </button>
                            <button className="text-xs text-gray-500 hover:text-blue-500 transition-colors">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Reply Form */}
                  {!selectedPost.isLocked && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start space-x-3">
                        <img
                          src={currentUser?.avatar}
                          alt={currentUser?.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex space-x-2">
                              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <Image className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <Paperclip className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <Smile className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleReply(selectedPost.id)}
                              disabled={!replyContent.trim()}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                            >
                              <Send className="w-4 h-4" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Posts List View */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {sortedPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="flex items-start space-x-4">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                            {post.title}
                          </h3>
                          {post.isPinned && <Pin className="w-4 h-4 text-yellow-500" />}
                          {post.isLocked && <Lock className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="font-medium">{post.author.name}</span>
                          <span>{formatTimeAgo(post.createdAt)}</span>
                          <span className="px-2 py-1 bg-gray-100 rounded-full capitalize">
                            {post.category}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3 line-clamp-2">{post.content}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{post.tags.length - 3} more</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Reply className="w-4 h-4" />
                              <span>{post.replies.length}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>234</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {sortedPosts.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery || activeCategory !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : 'Be the first to start a discussion!'
                      }
                    </p>
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create First Post
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
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
                  <h2 className="text-xl font-bold">Create New Post</h2>
                  <button
                    onClick={() => setShowCreatePost(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={newPostData.title}
                      onChange={(e) => setNewPostData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="What's your question or topic?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newPostData.category}
                      onChange={(e) => setNewPostData(prev => ({ ...prev, category: e.target.value as any }))}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea
                      value={newPostData.content}
                      onChange={(e) => setNewPostData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Share your thoughts, ask questions, or start a discussion..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newPostData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center space-x-1"
                        >
                          <span>#{tag}</span>
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        placeholder="Add tags..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={addTag}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowCreatePost(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostData.title.trim() || !newPostData.content.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Create Post
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

export { CommunityForum };
export default CommunityForum;