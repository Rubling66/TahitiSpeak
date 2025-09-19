'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Three.js
const TalkingHeadComponent = dynamic(() => import('./TalkingHeadCore'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">Loading 3D Avatar...</div>
});

interface TalkingHeadAvatarProps {
  text?: string;
  language?: 'fr' | 'en';
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  mood?: 'neutral' | 'happy' | 'sad' | 'surprised';
  muted?: boolean;
}

export default function TalkingHeadAvatar({
  text,
  language = 'fr',
  onSpeechStart,
  onSpeechEnd,
  onError,
  className = '',
  mood = 'neutral',
  muted = false
}: TalkingHeadAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsLoading(false);
  };

  const handleError = (err: Error) => {
    setError(err.message);
    setIsLoading(false);
    onError?.(err);
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-red-600 font-medium">Avatar Error</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading 3D Avatar...</p>
          </div>
        </div>
      )}
      <TalkingHeadComponent
        text={text}
        language={language}
        onSpeechStart={onSpeechStart}
        onSpeechEnd={onSpeechEnd}
        onLoad={handleLoad}
        onError={handleError}
        mood={mood}
        muted={muted}
      />
    </div>
  );
}

// Export types for use in other components
export type { TalkingHeadAvatarProps };