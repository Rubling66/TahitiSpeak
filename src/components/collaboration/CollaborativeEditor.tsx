'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageSquare, 
  History, 
  Settings,
  Wifi,
  WifiOff,
  Save,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { UserPresence } from './UserPresence';
import { CollaborativeCursors } from './CollaborativeCursors';
import { CollaborativeComments } from './CollaborativeComments';
import { VersionHistory } from './VersionHistory';
import { TahitianRichEditor } from '@/components/admin/editor/TahitianRichEditor';
import { 
  collaborationService, 
  CollaborationUser, 
  DocumentVersion,
  Comment 
} from '@/services/collaboration/CollaborationService';

interface CollaborativeEditorProps {
  lessonId: string;
  initialContent?: string;
  currentUser: CollaborationUser;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
  className?: string;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  lessonId,
  initialContent = '',
  currentUser,
  onContentChange,
  onSave,
  className = ''
}) => {
  const [content, setContent] = useState(initialContent);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<CollaborationUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const editorRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize collaboration service
    const initializeCollaboration = async () => {
      try {
        await collaborationService.connectToLesson(lessonId, currentUser);
        setIsConnected(true);
        toast.success('Connected to collaborative session');
      } catch (error) {
        console.error('Failed to connect to collaboration service:', error);
        toast.error('Failed to connect to collaborative session');
      }
    };

    initializeCollaboration();

    // Set up event listeners
    const handleUserJoined = (user: CollaborationUser) => {
      setConnectedUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      toast.info(`${user.name} joined the session`);
    };

    const handleUserLeft = (userId: string) => {
      setConnectedUsers(prev => {
        const user = prev.find(u => u.id === userId);
        if (user) {
          toast.info(`${user.name} left the session`);
        }
        return prev.filter(u => u.id !== userId);
      });
    };

    const handleContentChanged = ({ content: newContent, author }: any) => {
      if (author.id !== currentUser.id) {
        setContent(newContent);
        onContentChange?.(newContent);
        toast.info(`Content updated by ${author.name}`);
      }
    };

    const handleCommentAdded = (comment: Comment) => {
      setComments(prev => [...prev, comment]);
      if (comment.author.id !== currentUser.id) {
        toast.info(`New comment from ${comment.author.name}`);
      }
    };

    const handleCommentUpdated = (comment: Comment) => {
      setComments(prev => prev.map(c => c.id === comment.id ? comment : c));
    };

    const handleCommentDeleted = (commentId: string) => {
      setComments(prev => prev.filter(c => c.id !== commentId));
    };

    const handleConnectionStatusChanged = (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        toast.success('Reconnected to collaborative session');
      } else {
        toast.error('Disconnected from collaborative session');
      }
    };

    // Register event listeners
    collaborationService.on('user-joined', handleUserJoined);
    collaborationService.on('user-left', handleUserLeft);
    collaborationService.on('content-changed', handleContentChanged);
    collaborationService.on('comment-added', handleCommentAdded);
    collaborationService.on('comment-updated', handleCommentUpdated);
    collaborationService.on('comment-deleted', handleCommentDeleted);
    collaborationService.on('connection-status-changed', handleConnectionStatusChanged);

    return () => {
      // Cleanup
      collaborationService.off('user-joined', handleUserJoined);
      collaborationService.off('user-left', handleUserLeft);
      collaborationService.off('content-changed', handleContentChanged);
      collaborationService.off('comment-added', handleCommentAdded);
      collaborationService.off('comment-updated', handleCommentUpdated);
      collaborationService.off('comment-deleted', handleCommentDeleted);
      collaborationService.off('connection-status-changed', handleConnectionStatusChanged);
      
      collaborationService.disconnect();
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [lessonId, currentUser]);

  const handleContentUpdate = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    onContentChange?.(newContent);

    // Send content change to other users
    if (isConnected) {
      collaborationService.sendContentChange(newContent, []);
    }

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave(newContent);
    }, 2000);
  };

  const handleAutoSave = async (contentToSave: string) => {
    if (!hasUnsavedChanges) return;

    setIsAutoSaving(true);
    try {
      onSave?.(contentToSave);
      setHasUnsavedChanges(false);
      toast.success('Auto-saved', { duration: 1000 });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Auto-save failed');
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleManualSave = () => {
    if (onSave) {
      onSave(content);
      setHasUnsavedChanges(false);
      toast.success('Saved successfully');
    }
  };

  const handleVersionRestore = (version: DocumentVersion) => {
    setContent(version.content);
    onContentChange?.(version.content);
    setHasUnsavedChanges(true);
    
    // Send restored content to other users
    if (isConnected) {
      collaborationService.sendContentChange(version.content, []);
    }
  };

  const handleCursorMove = (position: number) => {
    if (isConnected) {
      collaborationService.sendCursorMove(position);
    }
  };

  const handleTextSelection = (start: number, end: number) => {
    if (isConnected) {
      collaborationService.sendTextSelection(start, end);
    }
  };

  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Wifi className="h-4 w-4" />
          <span className="text-sm">Connected</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm">Disconnected</span>
        </div>
      );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with status and controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Collaborative Editor
            </CardTitle>
            
            <div className="flex items-center gap-4">
              {getConnectionStatus()}
              
              {isAutoSaving && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              
              {hasUnsavedChanges && !isAutoSaving && (
                <Badge variant="outline" className="text-orange-600">
                  Unsaved changes
                </Badge>
              )}
              
              <Button
                size="sm"
                onClick={handleManualSave}
                disabled={!hasUnsavedChanges || isAutoSaving}
                className="h-8"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main editor layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Editor area */}
        <div className="lg:col-span-3">
          <Card className="relative">
            <CardContent className="p-0">
              {/* Collaborative cursors overlay */}
              <CollaborativeCursors />
              
              {/* Rich text editor */}
              <TahitianRichEditor
                ref={editorRef}
                initialContent={content}
                onContentChange={handleContentUpdate}
                onCursorMove={handleCursorMove}
                onTextSelection={handleTextSelection}
                className="min-h-[500px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Collaboration sidebar */}
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" className="text-xs">
                <Users className="h-4 w-4 mr-1" />
                Users
              </TabsTrigger>
              <TabsTrigger value="comments" className="text-xs">
                <MessageSquare className="h-4 w-4 mr-1" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="h-4 w-4 mr-1" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <UserPresence 
                users={connectedUsers}
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <CollaborativeComments
                comments={comments}
                currentUser={currentUser}
                onAddComment={(comment) => {
                  if (isConnected) {
                    collaborationService.addComment(comment);
                  }
                }}
                onUpdateComment={(comment) => {
                  if (isConnected) {
                    collaborationService.updateComment(comment);
                  }
                }}
                onDeleteComment={(commentId) => {
                  if (isConnected) {
                    collaborationService.deleteComment(commentId);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <VersionHistory
                onVersionRestore={handleVersionRestore}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Connection status footer */}
      {!isConnected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">
                You're working offline. Changes will sync when connection is restored.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};