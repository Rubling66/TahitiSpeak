import { useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

interface HotkeyConfig {
  key: string;
  modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: () => void;
  description: string;
  enabled?: boolean;
}

interface GlobalHotkeysOptions {
  onOpenApp?: () => void;
  onStartLesson?: () => void;
  onOpenPronunciation?: () => void;
  onShowProgress?: () => void;
  onToggleFloatingButton?: () => void;
  onToggleSystemTray?: () => void;
  enabled?: boolean;
}

export const useGlobalHotkeys = (options: GlobalHotkeysOptions) => {
  const {
    onOpenApp,
    onStartLesson,
    onOpenPronunciation,
    onShowProgress,
    onToggleFloatingButton,
    onToggleSystemTray,
    enabled = true
  } = options;

  const hotkeyListeners = useRef<Map<string, (event: KeyboardEvent) => void>>(new Map());
  const registeredHotkeys = useRef<HotkeyConfig[]>([]);

  // Define default hotkey configurations
  const defaultHotkeys: HotkeyConfig[] = [
    {
      key: 't',
      modifiers: ['ctrl', 'shift'],
      action: onOpenApp || (() => {}),
      description: 'Open Tahiti French Tutor',
      enabled: !!onOpenApp
    },
    {
      key: 'l',
      modifiers: ['ctrl', 'shift'],
      action: onStartLesson || (() => {}),
      description: 'Start a new lesson',
      enabled: !!onStartLesson
    },
    {
      key: 'p',
      modifiers: ['ctrl', 'shift'],
      action: onOpenPronunciation || (() => {}),
      description: 'Open pronunciation practice',
      enabled: !!onOpenPronunciation
    },
    {
      key: 'r',
      modifiers: ['ctrl', 'shift'],
      action: onShowProgress || (() => {}),
      description: 'Show progress report',
      enabled: !!onShowProgress
    },
    {
      key: 'f',
      modifiers: ['ctrl', 'alt'],
      action: onToggleFloatingButton || (() => {}),
      description: 'Toggle floating action button',
      enabled: !!onToggleFloatingButton
    },
    {
      key: 's',
      modifiers: ['ctrl', 'alt'],
      action: onToggleSystemTray || (() => {}),
      description: 'Toggle system tray',
      enabled: !!onToggleSystemTray
    }
  ];

  const createHotkeyString = (key: string, modifiers: string[]): string => {
    return [...modifiers.sort(), key].join('+').toLowerCase();
  };

  const checkModifiers = (event: KeyboardEvent, modifiers: string[]): boolean => {
    const requiredModifiers = {
      ctrl: modifiers.includes('ctrl'),
      shift: modifiers.includes('shift'),
      alt: modifiers.includes('alt'),
      meta: modifiers.includes('meta')
    };

    return (
      event.ctrlKey === requiredModifiers.ctrl &&
      event.shiftKey === requiredModifiers.shift &&
      event.altKey === requiredModifiers.alt &&
      event.metaKey === requiredModifiers.meta
    );
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const key = event.key.toLowerCase();
    
    // Find matching hotkey
    const matchingHotkey = registeredHotkeys.current.find(hotkey => {
      return (
        hotkey.enabled &&
        hotkey.key.toLowerCase() === key &&
        checkModifiers(event, hotkey.modifiers)
      );
    });

    if (matchingHotkey) {
      event.preventDefault();
      event.stopPropagation();
      
      try {
        matchingHotkey.action();
        
        // Visual feedback for successful hotkey activation
        if (Platform.OS === 'web') {
          showHotkeyFeedback(matchingHotkey.description);
        }
      } catch (error) {
        console.warn('Error executing hotkey action:', error);
      }
    }
  }, [enabled]);

  const showHotkeyFeedback = (description: string) => {
    if (typeof document === 'undefined') return;

    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.textContent = `🌺 ${description}`;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4ECDC4, #44A08D);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideInFade 0.3s ease-out;
      pointer-events: none;
    `;

    // Add CSS animation if not already present
    if (!document.querySelector('#tahiti-hotkey-styles')) {
      const style = document.createElement('style');
      style.id = 'tahiti-hotkey-styles';
      style.textContent = `
        @keyframes slideInFade {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutFade {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(feedback);

    // Remove feedback after delay
    setTimeout(() => {
      feedback.style.animation = 'slideOutFade 0.3s ease-in';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }, 2000);
  };

  const registerHotkey = useCallback((config: HotkeyConfig) => {
    const hotkeyString = createHotkeyString(config.key, config.modifiers);
    
    // Remove existing hotkey if present
    unregisterHotkey(hotkeyString);
    
    // Add to registered hotkeys
    registeredHotkeys.current.push(config);
    
    return hotkeyString;
  }, []);

  const unregisterHotkey = useCallback((hotkeyString: string) => {
    registeredHotkeys.current = registeredHotkeys.current.filter(
      hotkey => createHotkeyString(hotkey.key, hotkey.modifiers) !== hotkeyString
    );
  }, []);

  const getRegisteredHotkeys = useCallback(() => {
    return registeredHotkeys.current.filter(hotkey => hotkey.enabled);
  }, []);

  const clearAllHotkeys = useCallback(() => {
    registeredHotkeys.current = [];
  }, []);

  // Initialize hotkeys
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    // Register default hotkeys
    defaultHotkeys.forEach(hotkey => {
      if (hotkey.enabled) {
        registerHotkey(hotkey);
      }
    });

    // Add global event listener
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      clearAllHotkeys();
    };
  }, [enabled, handleKeyDown, registerHotkey, clearAllHotkeys]);

  // Update hotkeys when options change
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    clearAllHotkeys();
    defaultHotkeys.forEach(hotkey => {
      if (hotkey.enabled) {
        registerHotkey(hotkey);
      }
    });
  }, [
    onOpenApp,
    onStartLesson,
    onOpenPronunciation,
    onShowProgress,
    onToggleFloatingButton,
    onToggleSystemTray,
    enabled,
    registerHotkey,
    clearAllHotkeys
  ]);

  return {
    registerHotkey,
    unregisterHotkey,
    getRegisteredHotkeys,
    clearAllHotkeys,
    isEnabled: enabled && Platform.OS === 'web'
  };
};

export default useGlobalHotkeys;