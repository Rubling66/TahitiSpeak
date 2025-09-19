'use client';

import React, { useEffect, useRef, useCallback } from 'react';
// TalkingHead will be imported dynamically to avoid SSR issues

interface TalkingHeadCoreProps {
  text?: string;
  language?: 'fr' | 'en';
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  mood?: 'neutral' | 'happy' | 'sad' | 'surprised';
  muted?: boolean;
}

export default function TalkingHeadCore({
  text,
  language = 'fr',
  onSpeechStart,
  onSpeechEnd,
  onLoad,
  onError,
  mood = 'neutral',
  muted = false
}: TalkingHeadCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const talkingHeadRef = useRef<any>(null);
  const isInitialized = useRef(false);

  const initializeTalkingHead = useCallback(async () => {
    if (!containerRef.current || isInitialized.current) return;

    try {
      // Dynamic import of TalkingHead to avoid SSR issues
      const TalkingHeadModule = await import('@met4citizen/talkinghead');
      const TalkingHead = (TalkingHeadModule as any).default || TalkingHeadModule;
      
      const options = {
        ttsLang: language === 'fr' ? 'fr-FR' : 'en-US',
        lipsyncLang: language,
        avatarMood: mood,
        avatarMute: muted,
        modelPixelRatio: window.devicePixelRatio || 1,
        modelFPS: 60,
        cameraView: 'upper',
        lightAmbientIntensity: 1.5,
        lightDirectIntensity: 20,
        avatarIdleEyeContact: 0.3,
        avatarSpeakingEyeContact: 0.7,
        avatarIdleHeadMove: 0.4,
        avatarSpeakingHeadMove: 0.6
      };

      talkingHeadRef.current = new TalkingHead(containerRef.current, options);
      
      // Load the default avatar
      const avatarConfig = {
        url: '/lib/TalkingHead/avatars/brunette.glb',
        body: 'F',
        lipsyncLang: language,
        ttsLang: language === 'fr' ? 'fr-FR' : 'en-US',
        avatarMood: mood,
        avatarMute: muted
      };

      await talkingHeadRef.current.showAvatar(avatarConfig, (url: string, event: any) => {
        // Progress callback
        console.log(`Loading ${url}: ${event.loaded}/${event.total}`);
      });

      isInitialized.current = true;
      onLoad?.();

    } catch (error) {
      console.error('Failed to initialize TalkingHead:', error);
      onError?.(error as Error);
    }
  }, [language, mood, muted, onLoad, onError]);

  const speakText = useCallback(async (textToSpeak: string) => {
    if (!talkingHeadRef.current || !textToSpeak.trim()) return;

    try {
      onSpeechStart?.();
      
      // Use the TalkingHead's speak method
      await talkingHeadRef.current.speakText(textToSpeak);
      
      onSpeechEnd?.();
    } catch (error) {
      console.error('Speech error:', error);
      onError?.(error as Error);
      onSpeechEnd?.();
    }
  }, [onSpeechStart, onSpeechEnd, onError]);

  // Initialize TalkingHead on mount
  useEffect(() => {
    initializeTalkingHead();

    return () => {
      if (talkingHeadRef.current) {
        try {
          talkingHeadRef.current.dispose?.();
        } catch (error) {
          console.warn('Error disposing TalkingHead:', error);
        }
      }
    };
  }, [initializeTalkingHead]);

  // Handle text changes
  useEffect(() => {
    if (text && isInitialized.current) {
      speakText(text);
    }
  }, [text, speakText]);

  // Handle mood changes
  useEffect(() => {
    if (talkingHeadRef.current && isInitialized.current) {
      try {
        talkingHeadRef.current.setMood?.(mood);
      } catch (error) {
        console.warn('Error setting mood:', error);
      }
    }
  }, [mood]);

  // Handle mute changes
  useEffect(() => {
    if (talkingHeadRef.current && isInitialized.current) {
      try {
        talkingHeadRef.current.setMute?.(muted);
      } catch (error) {
        console.warn('Error setting mute:', error);
      }
    }
  }, [muted]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-64 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg overflow-hidden"
      style={{ minHeight: '256px' }}
    />
  );
}