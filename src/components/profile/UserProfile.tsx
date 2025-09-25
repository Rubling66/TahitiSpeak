'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserProfileProps {
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
}

export function UserProfile({ user }: UserProfileProps) {
  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No user data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xl font-semibold text-gray-600">
                {user.name?.[0] || user.email[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{user.name || 'User'}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">Profile Information</h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">User ID:</span> {user.id}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">Edit Profile</Button>
          <Button variant="outline">Change Password</Button>
        </div>
      </div>
    </Card>
  );
}

export default UserProfile;