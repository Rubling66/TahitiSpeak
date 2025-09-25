import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcutConfig[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    for (const shortcut of shortcuts) {
      const {
        key,
        ctrlKey = false,
        shiftKey = false,
        altKey = false,
        metaKey = false,
        callback
      } = shortcut;

      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatches = event.ctrlKey === ctrlKey;
      const shiftMatches = event.shiftKey === shiftKey;
      const altMatches = event.altKey === altKey;
      const metaMatches = event.metaKey === metaKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        event.preventDefault();
        event.stopPropagation();
        callback();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    // Only add keyboard listeners on web platform
    if (Platform.OS === 'web') {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown]);

  return {
    isSupported: Platform.OS === 'web'
  };
};

// Predefined shortcuts for the Tahiti French Tutor app
export const createAppShortcuts = (callbacks: {
  focusApp: () => void;
  openQuickLaunch: () => void;
  startLesson: () => void;
  openPronunciation: () => void;
  toggleFloatingButton: () => void;
}): KeyboardShortcutConfig[] => [
  {
    key: 't',
    ctrlKey: true,
    shiftKey: true,
    callback: callbacks.focusApp,
    description: 'Focus Tahiti French Tutor (Ctrl+Shift+T)'
  },
  {
    key: 'l',
    ctrlKey: true,
    shiftKey: true,
    callback: callbacks.startLesson,
    description: 'Start Quick Lesson (Ctrl+Shift+L)'
  },
  {
    key: 'p',
    ctrlKey: true,
    shiftKey: true,
    callback: callbacks.openPronunciation,
    description: 'Open Pronunciation Practice (Ctrl+Shift+P)'
  },
  {
    key: 'q',
    ctrlKey: true,
    shiftKey: true,
    callback: callbacks.openQuickLaunch,
    description: 'Open Quick Launch Menu (Ctrl+Shift+Q)'
  },
  {
    key: 'f',
    ctrlKey: true,
    shiftKey: true,
    callback: callbacks.toggleFloatingButton,
    description: 'Toggle Floating Action Button (Ctrl+Shift+F)'
  }
];

export default useKeyboardShortcuts;