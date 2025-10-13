'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Type, 
  Contrast, 
  MousePointer,
  Keyboard,
  Focus,
  Accessibility
} from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  audioDescriptions: boolean;
}

interface AccessibilityEnhancerProps {
  children: React.ReactNode;
  enableAnnouncements?: boolean;
  enableKeyboardShortcuts?: boolean;
}

// Screen reader announcements
const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus management utilities
const focusManagement = {
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  restoreFocus: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },

  getNextFocusableElement: (current: HTMLElement, direction: 'next' | 'prev' = 'next') => {
    const focusableElements = Array.from(document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(current);
    if (currentIndex === -1) return null;

    const nextIndex = direction === 'next' 
      ? (currentIndex + 1) % focusableElements.length
      : (currentIndex - 1 + focusableElements.length) % focusableElements.length;

    return focusableElements[nextIndex];
  }
};

// Keyboard shortcuts
const keyboardShortcuts = {
  'Alt+1': () => {
    const mainContent = document.querySelector('main, [role="main"]') as HTMLElement;
    mainContent?.focus();
    announceToScreenReader('Navigation vers le contenu principal');
  },
  
  'Alt+2': () => {
    const navigation = document.querySelector('nav, [role="navigation"]') as HTMLElement;
    navigation?.focus();
    announceToScreenReader('Navigation vers le menu');
  },
  
  'Alt+3': () => {
    const search = document.querySelector('input[type="search"], [role="search"] input') as HTMLElement;
    search?.focus();
    announceToScreenReader('Navigation vers la recherche');
  },
  
  'Escape': () => {
    const modal = document.querySelector('[role="dialog"], [role="alertdialog"]') as HTMLElement;
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="fermer"], [aria-label*="close"]') as HTMLElement;
      closeButton?.click();
    }
  },
  
  'F6': () => {
    const currentFocus = document.activeElement as HTMLElement;
    const nextElement = focusManagement.getNextFocusableElement(currentFocus);
    nextElement?.focus();
  }
};

const AccessibilityEnhancer: React.FC<AccessibilityEnhancerProps> = ({
  children,
  enableAnnouncements = true,
  enableKeyboardShortcuts = true
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderMode: false,
    keyboardNavigation: true,
    focusIndicators: true,
    audioDescriptions: false
  });

  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applyAccessibilitySettings(settings);
  }, [settings]);

  // Apply accessibility settings to document
  const applyAccessibilitySettings = useCallback((settings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);
    
    // Large text
    root.classList.toggle('large-text', settings.largeText);
    
    // Reduced motion
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    
    // Screen reader mode
    root.classList.toggle('screen-reader-mode', settings.screenReaderMode);
    
    // Focus indicators
    root.classList.toggle('enhanced-focus', settings.focusIndicators);
    
    // Keyboard navigation
    root.classList.toggle('keyboard-navigation', settings.keyboardNavigation);
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = `${e.altKey ? 'Alt+' : ''}${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`;
      const shortcut = keyboardShortcuts[key as keyof typeof keyboardShortcuts];
      
      if (shortcut) {
        e.preventDefault();
        shortcut();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts]);

  // Focus management for accessibility panel
  useEffect(() => {
    if (isVisible && containerRef.current) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const cleanup = focusManagement.trapFocus(containerRef.current);
      
      return () => {
        cleanup();
        focusManagement.restoreFocus(previousFocusRef.current);
      };
    }
  }, [isVisible]);

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      
      if (enableAnnouncements) {
        const settingName = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        const status = newSettings[key] ? 'activé' : 'désactivé';
        announceToScreenReader(`${settingName} ${status}`);
      }
      
      return newSettings;
    });
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReaderMode: false,
      keyboardNavigation: true,
      focusIndicators: true,
      audioDescriptions: false
    };
    
    setSettings(defaultSettings);
    
    if (enableAnnouncements) {
      announceToScreenReader('Paramètres d\'accessibilité réinitialisés');
    }
  };

  return (
    <>
      {children}
      
      {/* Accessibility Toggle Button */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0"
        aria-label="Ouvrir les paramètres d'accessibilité"
        title="Paramètres d'accessibilité (Alt+A)"
      >
        <Accessibility className="h-6 w-6" />
      </Button>

      {/* Accessibility Panel */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-labelledby="accessibility-title"
          aria-modal="true"
        >
          <Card 
            ref={containerRef}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle id="accessibility-title" className="flex items-center gap-2">
                  <Accessibility className="h-5 w-5" />
                  Paramètres d'Accessibilité
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  aria-label="Fermer les paramètres d'accessibilité"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Visual Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Paramètres Visuels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={settings.highContrast ? "default" : "outline"}
                    onClick={() => toggleSetting('highContrast')}
                    className="justify-start h-auto p-4"
                    aria-pressed={settings.highContrast}
                  >
                    <Contrast className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Contraste Élevé</div>
                      <div className="text-sm opacity-70">Améliore la lisibilité</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant={settings.largeText ? "default" : "outline"}
                    onClick={() => toggleSetting('largeText')}
                    className="justify-start h-auto p-4"
                    aria-pressed={settings.largeText}
                  >
                    <Type className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Texte Agrandi</div>
                      <div className="text-sm opacity-70">Augmente la taille du texte</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Motion Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Mouvement et Animation</h3>
                <Button
                  variant={settings.reducedMotion ? "default" : "outline"}
                  onClick={() => toggleSetting('reducedMotion')}
                  className="justify-start h-auto p-4 w-full"
                  aria-pressed={settings.reducedMotion}
                >
                  <MousePointer className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Mouvement Réduit</div>
                    <div className="text-sm opacity-70">Désactive les animations</div>
                  </div>
                </Button>
              </div>

              {/* Navigation Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Navigation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={settings.keyboardNavigation ? "default" : "outline"}
                    onClick={() => toggleSetting('keyboardNavigation')}
                    className="justify-start h-auto p-4"
                    aria-pressed={settings.keyboardNavigation}
                  >
                    <Keyboard className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Navigation Clavier</div>
                      <div className="text-sm opacity-70">Améliore l'accessibilité clavier</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant={settings.focusIndicators ? "default" : "outline"}
                    onClick={() => toggleSetting('focusIndicators')}
                    className="justify-start h-auto p-4"
                    aria-pressed={settings.focusIndicators}
                  >
                    <Focus className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Indicateurs de Focus</div>
                      <div className="text-sm opacity-70">Améliore la visibilité du focus</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Screen Reader Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Lecteur d'Écran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={settings.screenReaderMode ? "default" : "outline"}
                    onClick={() => toggleSetting('screenReaderMode')}
                    className="justify-start h-auto p-4"
                    aria-pressed={settings.screenReaderMode}
                  >
                    <Eye className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Mode Lecteur d'Écran</div>
                      <div className="text-sm opacity-70">Optimise pour les lecteurs d'écran</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant={settings.audioDescriptions ? "default" : "outline"}
                    onClick={() => toggleSetting('audioDescriptions')}
                    className="justify-start h-auto p-4"
                    aria-pressed={settings.audioDescriptions}
                  >
                    <Volume2 className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Descriptions Audio</div>
                      <div className="text-sm opacity-70">Active les descriptions audio</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Keyboard Shortcuts Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Raccourcis Clavier</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Contenu principal:</span>
                    <Badge variant="outline">Alt + 1</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Navigation:</span>
                    <Badge variant="outline">Alt + 2</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Recherche:</span>
                    <Badge variant="outline">Alt + 3</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Fermer modal:</span>
                    <Badge variant="outline">Échap</Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={resetSettings} variant="outline" className="flex-1">
                  Réinitialiser
                </Button>
                <Button onClick={() => setIsVisible(false)} className="flex-1">
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default AccessibilityEnhancer;
export { announceToScreenReader, focusManagement, keyboardShortcuts };