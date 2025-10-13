// StoryDiscussions Component - Community engagement and cultural Q&A
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Plus, 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  CheckCircle,
  HelpCircle,
  Users,
  Clock,
  ArrowLeft,
  Send
} from 'lucide-react';
import { useStoryDiscussions } from '@/hooks/useStoryDiscussions';
import { getCurrentUser } from '@/lib/supabase/client';
import type { 
  StoryDiscussion, 
  DiscussionType,
  StoryDiscussionsProps 
} from '@/types/story-system';

export function StoryDiscussions({ 
  storyId, 
  storyTitle, 
  onClose 
}: StoryDiscussionsProps) {
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [newDiscussionType, setNewDiscussionType] = useState<DiscussionType>('general');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string>();
  const [replyContent, setReplyContent] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  const {
    discussions,
    loading,
    error,
    addDiscussion,
    replyToDiscussion,
    voteOnDiscussion,
    markAsAnswered,
    getDiscussionsByType,
    getReplies
  } = useStoryDiscussions(storyId);

  // Handle new discussion submission
  const handleSubmitDiscussion = async () => {
    if (!newDiscussionTitle.trim() || !newDiscussionContent.trim()) return;

    try {
      await addDiscussion(
        newDiscussionTitle,
        newDiscussionContent,
        newDiscussionType
      );
      
      setNewDiscussionTitle('');
      setNewDiscussionContent('');
      setShowNewDiscussion(false);
    } catch (err) {
      console.error('Error submitting discussion:', err);
    }
  };

  // Handle reply submission
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      await replyToDiscussion(parentId, replyContent);
      setReplyContent('');
      setReplyingTo(undefined);
    } catch (err) {
      console.error('Error submitting reply:', err);
    }
  };

  // Filter discussions based on selected tab
  const getFilteredDiscussions = (): StoryDiscussion[] => {
    const topLevelDiscussions = discussions.filter(d => !d.parent_id);
    
    switch (selectedTab) {
      case 'questions':
        return topLevelDiscussions.filter(d => d.discussion_type === 'question');
      case 'cultural':
        return topLevelDiscussions.filter(d => d.discussion_type === 'cultural_question');
      case 'general':
        return topLevelDiscussions.filter(d => d.discussion_type === 'general');
      default:
        return topLevelDiscussions;
    }
  };

  const discussionTypes: { value: DiscussionType; label: string; icon: React.ReactNode }[] = [
    { value: 'general', label: 'General Discussion', icon: <MessageCircle className="h-4 w-4" /> },
    { value: 'question', label: 'Question', icon: <HelpCircle className="h-4 w-4" /> },
    { value: 'cultural_question', label: 'Cultural Question', icon: <Users className="h-4 w-4" /> }
  ];

  const getTypeColor = (type: DiscussionType): string => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      question: 'bg-orange-100 text-orange-800',
      cultural_question: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-gray-600">Loading discussions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredDiscussions = getFilteredDiscussions();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                Story Discussions
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Discuss &quot;{storyTitle}&quot; with the community
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowNewDiscussion(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Discussion
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* New Discussion Form */}
      {showNewDiscussion && (
        <Card>
          <CardHeader>
            <CardTitle>Start a New Discussion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Discussion Type</label>
              <div className="flex gap-2">
                {discussionTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={newDiscussionType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewDiscussionType(type.value)}
                    className="flex items-center gap-2"
                  >
                    {type.icon}
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                placeholder="What would you like to discuss?"
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                placeholder="Share your thoughts, questions, or insights..."
                value={newDiscussionContent}
                onChange={(e) => setNewDiscussionContent(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmitDiscussion}
                disabled={!newDiscussionTitle.trim() || !newDiscussionContent.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Post Discussion
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewDiscussion(false);
                  setNewDiscussionTitle('');
                  setNewDiscussionContent('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discussion Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({discussions.filter(d => !d.parent_id).length})</TabsTrigger>
          <TabsTrigger value="questions">Questions ({getDiscussionsByType('question').length})</TabsTrigger>
          <TabsTrigger value="cultural">Cultural ({getDiscussionsByType('cultural_question').length})</TabsTrigger>
          <TabsTrigger value="general">General ({getDiscussionsByType('general').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredDiscussions.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredDiscussions.map((discussion) => (
                  <DiscussionCard
                    key={discussion.id}
                    discussion={discussion}
                    replies={getReplies(discussion.id)}
                    onVote={voteOnDiscussion}
                    onMarkAnswered={markAsAnswered}
                    onReply={(content) => handleSubmitReply(discussion.id)}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    getTypeColor={getTypeColor}
                    formatTimeAgo={formatTimeAgo}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Discussions Yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to start a discussion about this story
                </p>
                <Button onClick={() => setShowNewDiscussion(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Discussion
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Discussion Card Component
interface DiscussionCardProps {
  discussion: StoryDiscussion;
  replies: StoryDiscussion[];
  onVote: (discussionId: string, isUpvote: boolean) => void;
  onMarkAnswered: (discussionId: string) => void;
  onReply: (content: string) => void;
  replyingTo?: string;
  setReplyingTo: (id?: string) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  getTypeColor: (type: DiscussionType) => string;
  formatTimeAgo: (date: string) => string;
}

function DiscussionCard({
  discussion,
  replies,
  onVote,
  onMarkAnswered,
  onReply,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  getTypeColor,
  formatTimeAgo
}: DiscussionCardProps) {
  const [currentUser, setCurrentUser] = useState<any>();

  React.useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  const isReplying = replyingTo === discussion.id;

  return (
    <Card className={discussion.is_answered ? 'border-green-200 bg-green-50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getTypeColor(discussion.discussion_type)}>
                {discussion.discussion_type.replace('_', ' ')}
              </Badge>
              {discussion.is_answered && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Answered
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">{discussion.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(discussion.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                User {discussion.user_id.slice(0, 8)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-700 whitespace-pre-wrap">{discussion.content}</p>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVote(discussion.id, true)}
                className="flex items-center gap-1"
              >
                <ThumbsUp className="h-4 w-4" />
                {discussion.upvotes}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVote(discussion.id, false)}
                className="flex items-center gap-1"
              >
                <ThumbsDown className="h-4 w-4" />
                {discussion.downvotes}
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(isReplying ? undefined : discussion.id)}
              className="flex items-center gap-1"
            >
              <Reply className="h-4 w-4" />
              Reply
            </Button>
            
            {discussion.discussion_type === 'question' && 
             !discussion.is_answered && 
             currentUser?.id === discussion.user_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAnswered(discussion.id)}
                className="flex items-center gap-1 text-green-600"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Answered
              </Button>
            )}
          </div>
          
          {replies.length > 0 && (
            <Badge variant="secondary">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </Badge>
          )}
        </div>
        
        {/* Reply Form */}
        {isReplying && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Textarea
              placeholder="Write your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onReply(replyContent)}
                disabled={!replyContent.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Post Reply
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyingTo(undefined);
                  setReplyContent('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-3 pl-4 border-l-2 border-gray-200">
            {replies.map((reply) => (
              <div key={reply.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-3 w-3" />
                    User {reply.user_id.slice(0, 8)}
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(reply.created_at)}
                  </div>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {reply.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}