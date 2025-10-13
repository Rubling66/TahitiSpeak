'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Eye, EyeOff, Circle } from 'lucide-react';
import { CollaborationUser, collaborationService } from '@/services/collaboration/CollaborationService';

interface UserPresenceProps {
  className?: string;
  showUserList?: boolean;
  maxVisibleUsers?: number;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  className = '',
  showUserList = true,
  maxVisibleUsers = 5
}) => {
  const [connectedUsers, setConnectedUsers] = useState<CollaborationUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);

  useEffect(() => {
    // Get initial connected users
    setConnectedUsers(collaborationService.getConnectedUsers());

    // Listen for user events
    const handleUserJoined = (user: CollaborationUser) => {
      setConnectedUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (exists) return prev;
        return [...prev, user];
      });
    };

    const handleUserLeft = (user: CollaborationUser) => {
      setConnectedUsers(prev => prev.filter(u => u.id !== user.id));
    };

    const handleUserActive = (user: CollaborationUser) => {
      setConnectedUsers(prev => 
        prev.map(u => u.id === user.id ? { ...u, status: 'active' } : u)
      );
    };

    const handleUserAway = (user: CollaborationUser) => {
      setConnectedUsers(prev => 
        prev.map(u => u.id === user.id ? { ...u, status: 'away' } : u)
      );
    };

    collaborationService.on('user-joined', handleUserJoined);
    collaborationService.on('user-left', handleUserLeft);
    collaborationService.on('user-active', handleUserActive);
    collaborationService.on('user-away', handleUserAway);

    return () => {
      collaborationService.off('user-joined', handleUserJoined);
      collaborationService.off('user-left', handleUserLeft);
      collaborationService.off('user-active', handleUserActive);
      collaborationService.off('user-away', handleUserAway);
    };
  }, []);

  const visibleUsers = connectedUsers.slice(0, maxVisibleUsers);
  const hiddenUsersCount = Math.max(0, connectedUsers.length - maxVisibleUsers);

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusIcon = (user: CollaborationUser) => {
    const status = (user as any).status || 'active';
    switch (status) {
      case 'active':
        return <Circle className="h-2 w-2 fill-green-500 text-green-500" />;
      case 'away':
        return <Circle className="h-2 w-2 fill-yellow-500 text-yellow-500" />;
      default:
        return <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />;
    }
  };

  if (!showUserList) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Users className="h-4 w-4 text-gray-600" />
        <span className="text-sm text-gray-600">
          {connectedUsers.length} {connectedUsers.length === 1 ? 'user' : 'users'} online
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Collaborators ({connectedUsers.length})
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              Live
            </Badge>
          </div>

          <div className="space-y-3">
            {/* Current User Avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {visibleUsers.map((user) => (
                  <Tooltip key={user.id}>
                    <TooltipTrigger>
                      <div className="relative">
                        <Avatar 
                          className="h-8 w-8 border-2 border-white ring-2"
                          style={{ ringColor: user.color }}
                        >
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback 
                            className="text-xs font-medium text-white"
                            style={{ backgroundColor: user.color }}
                          >
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          {getStatusIcon(user)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs">
                          {(user as any).status === 'away' ? 'Away' : 'Active'}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                
                {hiddenUsersCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          +{hiddenUsersCount}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{hiddenUsersCount} more {hiddenUsersCount === 1 ? 'user' : 'users'}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Detailed User List */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {connectedUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback 
                        className="text-xs font-medium text-white"
                        style={{ backgroundColor: user.color }}
                      >
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      {getStatusIcon(user)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {user.cursor && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Eye className="h-3 w-3 text-green-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Currently editing</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {connectedUsers.length === 0 && (
              <div className="text-center py-4">
                <EyeOff className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No other users online</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};