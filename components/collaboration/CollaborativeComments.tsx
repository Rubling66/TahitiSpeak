'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Check, 
  X, 
  Reply, 
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Comment, CollaborationUser, collaborationService } from '@/services/collaboration/CollaborationService';

interface CollaborativeCommentsProps {
  className?: string;
  currentUser?: CollaborationUser;
}

export const CollaborativeComments: React.FC<CollaborativeCommentsProps> = ({
  className = '',
  currentUser
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedText, setSelectedText] = useState<{ text: string; from: number; to: number } | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load initial comments
    setComments(collaborationService.getComments());

    // Listen for comment events
    const handleCommentAdded = (comment: Comment) => {
      setComments(prev => [...prev, comment]);
    };

    const handleCommentUpdated = (comment: Comment) => {
      setComments(prev => 
        prev.map(c => c.id === comment.id ? comment : c)
      );
    };

    const handleCommentDeleted = (commentId: string) => {
      setComments(prev => prev.filter(c => c.id !== commentId));
    };

    collaborationService.on('comment-added', handleCommentAdded);
    collaborationService.on('comment-updated', handleCommentUpdated);
    collaborationService.on('comment-deleted', handleCommentDeleted);

    return () => {
      collaborationService.off('comment-added', handleCommentAdded);
      collaborationService.off('comment-updated', handleCommentUpdated);
      collaborationService.off('comment-deleted', handleCommentDeleted);
    };
  }, []);

  // Listen for text selection in the editor
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        setSelectedText({
          text: selection.toString(),
          from: range.startOffset,
          to: range.endOffset
        });
      } else {
        setSelectedText(null);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser) return;

    const position = selectedText 
      ? { from: selectedText.from, to: selectedText.to }
      : { from: 0, to: 0 };

    collaborationService.addComment(newComment.trim(), position);
    setNewComment('');
    setSelectedText(null);
    toast.success('Comment added successfully!');
  };

  const handleReplyToComment = (parentId: string, content: string) => {
    if (!content.trim() || !currentUser) return;

    const parentComment = comments.find(c => c.id === parentId);
    if (!parentComment) return;

    const replyId = collaborationService.addComment(
      content.trim(), 
      parentComment.position
    );

    // Add reply to parent comment
    const updatedComments = comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), {
            id: replyId,
            content: content.trim(),
            author: currentUser,
            position: parentComment.position,
            timestamp: Date.now(),
            resolved: false
          }]
        };
      }
      return comment;
    });

    setComments(updatedComments);
    setReplyingTo(null);
    toast.success('Reply added successfully!');
  };

  const handleEditComment = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    setEditingComment(commentId);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;

    collaborationService.updateComment(commentId, editContent.trim());
    setEditingComment(null);
    setEditContent('');
    toast.success('Comment updated successfully!');
  };

  const handleDeleteComment = (commentId: string) => {
    collaborationService.deleteComment(commentId);
    toast.success('Comment deleted successfully!');
  };

  const handleResolveComment = (commentId: string) => {
    collaborationService.resolveComment(commentId);
    toast.success('Comment resolved!');
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredComments = showResolved 
    ? comments 
    : comments.filter(comment => !comment.resolved);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments ({filteredComments.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? 'Hide Resolved' : 'Show Resolved'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add new comment */}
        <div className="space-y-3">
          {selectedText && (
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-blue-800 font-medium">Selected text:</p>
              <p className="text-sm text-blue-700 italic">"{selectedText.text}"</p>
            </div>
          )}
          
          <div className="flex gap-3">
            {currentUser && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback 
                  className="text-xs font-medium text-white"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {getUserInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1 space-y-2">
              <Textarea
                ref={textareaRef}
                placeholder={selectedText ? "Comment on selected text..." : "Add a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {selectedText ? 'Commenting on selection' : 'General comment'}
                </div>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Comments list */}
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {filteredComments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No comments yet</p>
                <p className="text-sm text-gray-400">
                  Select text and add a comment to start the conversation
                </p>
              </div>
            ) : (
              filteredComments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                      <AvatarFallback 
                        className="text-xs font-medium text-white"
                        style={{ backgroundColor: comment.author.color }}
                      >
                        {getUserInitials(comment.author.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.author.name}</span>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(comment.timestamp)}
                          </span>
                          {comment.resolved && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>

                        {currentUser?.id === comment.author.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditComment(comment.id)}>
                                <Edit className="h-3 w-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {editingComment === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px] resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={!editContent.trim()}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingComment(null);
                                setEditContent('');
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700">{comment.content}</p>
                          
                          {comment.position.from !== comment.position.to && (
                            <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 italic">
                              Referenced text position: {comment.position.from}-{comment.position.to}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReplyingTo(comment.id)}
                              className="h-6 text-xs"
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                            
                            {!comment.resolved && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResolveComment(comment.id)}
                                className="h-6 text-xs text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>

                          {/* Reply form */}
                          {replyingTo === comment.id && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-200">
                              <div className="flex gap-2">
                                <Textarea
                                  placeholder="Write a reply..."
                                  className="min-h-[60px] resize-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                      const content = e.currentTarget.value;
                                      if (content.trim()) {
                                        handleReplyToComment(comment.id, content);
                                        e.currentTarget.value = '';
                                      }
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    const textarea = e.currentTarget.parentElement?.previousElementSibling?.querySelector('textarea') as HTMLTextAreaElement;
                                    if (textarea?.value.trim()) {
                                      handleReplyToComment(comment.id, textarea.value);
                                      textarea.value = '';
                                    }
                                  }}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setReplyingTo(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage src={reply.author.avatar} alt={reply.author.name} />
                                    <AvatarFallback 
                                      className="text-xs font-medium text-white"
                                      style={{ backgroundColor: reply.author.color }}
                                    >
                                      {getUserInitials(reply.author.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-xs">{reply.author.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {formatTimestamp(reply.timestamp)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};