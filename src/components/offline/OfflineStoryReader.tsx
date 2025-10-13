import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Wifi, WifiOff, Book, Bookmark, BookmarkCheck, Type, Palette, Settings } from 'lucide-react';
import { offlineDB, OfflineStory, OfflineNote, OfflineBookmark } from '../../services/offlineDatabase';
import { offlineManager } from '../../services/offlineManager';

interface OfflineStoryReaderProps {
  storyId: string;
  userId: string;
  onBookmark?: (bookmark: OfflineBookmark) => void;
  onNote?: (note: OfflineNote) => void;
  className?: string;
}

interface ReadingSettings {
  fontSize: number;
  fontFamily: string;
  theme: 'light' | 'dark' | 'sepia';
  lineHeight: number;
  wordSpacing: number;
}

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
}

interface ReadingProgress {
  currentPage: number;
  totalPages: number;
  scrollPosition: number;
  timeSpent: number;
  completed: boolean;
}

export const OfflineStoryReader: React.FC<OfflineStoryReaderProps> = ({
  storyId,
  userId,
  onBookmark,
  onNote,
  className = ''
}) => {
  const [story, setStory] = useState<OfflineStory | null>(null);
  const [progress, setProgress] = useState<ReadingProgress>({
    currentPage: 0,
    totalPages: 1,
    scrollPosition: 0,
    timeSpent: 0,
    completed: false
  });
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    playbackRate: 1
  });
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>({
    fontSize: 16,
    fontFamily: 'serif',
    theme: 'light',
    lineHeight: 1.6,
    wordSpacing: 0
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [notePosition, setNotePosition] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Load story data
  useEffect(() => {
    loadStory();
  }, [storyId]);

  // Load reading settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('readingSettings');
    if (savedSettings) {
      try {
        setReadingSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load reading settings:', error);
      }
    }
  }, []);

  // Save reading settings to localStorage
  useEffect(() => {
    localStorage.setItem('readingSettings', JSON.stringify(readingSettings));
  }, [readingSettings]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Track reading time
  useEffect(() => {
    startTimeRef.current = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setProgress(prev => ({ ...prev, timeSpent: prev.timeSpent + timeSpent }));
      startTimeRef.current = Date.now();
    }, 10000); // Update every 10 seconds

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleTimeUpdate = () => {
      setAudioState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleEnded = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleError = () => {
      setError('Failed to load audio content');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [story]);

  // Handle text selection for notes
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
        // Calculate position based on selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setNotePosition(rect.top + window.scrollY);
      } else {
        setSelectedText('');
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, []);

  const loadStory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load story from offline database
      const storyData = await offlineDB.stories.get(storyId);
      if (!storyData) {
        throw new Error('Story not found in offline storage');
      }

      setStory(storyData);

      // Check if story is bookmarked
      const bookmark = await offlineDB.userBookmarks
        .where(['userId', 'lessonId'])
        .equals([userId, storyId])
        .first();
      setIsBookmarked(!!bookmark);

      // Calculate total pages (rough estimate based on content length)
      const storyContent = typeof storyData.content === 'string' 
        ? storyData.content 
        : JSON.stringify(storyData.content);
      const wordsPerPage = 300;
      const wordCount = storyContent.split(/\s+/).length;
      const totalPages = Math.max(1, Math.ceil(wordCount / wordsPerPage));
      
      setProgress(prev => ({ ...prev, totalPages }));

      // Update last accessed time
      await offlineDB.stories.update(storyId, {
        lastAccessed: new Date().toISOString()
      });

    } catch (err) {
      console.error('Failed to load story:', err);
      setError(err instanceof Error ? err.message : 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioState.isPlaying) {
      audio.pause();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    } else {
      audio.play().catch(err => {
        console.error('Failed to play audio:', err);
        setError('Failed to play audio');
      });
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const restartAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setAudioState(prev => ({ ...prev, currentTime: 0 }));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMuted = !audioState.muted;
    audio.muted = newMuted;
    setAudioState(prev => ({ ...prev, muted: newMuted }));
  };

  const handleVolumeChange = (volume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    setAudioState(prev => ({ ...prev, volume }));
  };

  const handlePlaybackRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setAudioState(prev => ({ ...prev, playbackRate: rate }));
  };

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        // Remove bookmark
        await offlineDB.userBookmarks
          .where(['userId', 'lessonId'])
          .equals([userId, storyId])
          .delete();
        setIsBookmarked(false);
      } else {
        // Add bookmark
        const bookmark: OfflineBookmark = {
          id: `bookmark_${userId}_${storyId}_${Date.now()}`,
          userId,
          lessonId: storyId,
          title: story?.title || 'Untitled Story',
          createdAt: new Date().toISOString(),
          syncStatus: 'pending',
          localVersion: 1
        };

        await offlineDB.userBookmarks.add(bookmark);
        setIsBookmarked(true);

        if (onBookmark) {
          onBookmark(bookmark);
        }
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      setError('Failed to update bookmark');
    }
  };

  const saveNote = async () => {
    if (!noteContent.trim() || !story) return;

    try {
      const note: OfflineNote = {
        id: `note_${userId}_${storyId}_${Date.now()}`,
        userId,
        lessonId: storyId,
        content: noteContent,
        position: notePosition,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
        localVersion: 1
      };

      await offlineDB.userNotes.add(note);
      
      setNoteContent('');
      setShowNoteDialog(false);
      setSelectedText('');

      if (onNote) {
        onNote(note);
      }
    } catch (err) {
      console.error('Failed to save note:', err);
      setError('Failed to save note');
    }
  };

  const downloadStory = async () => {
    if (!story) return;

    try {
      await offlineManager.downloadStory(story.id);
      // Reload story to update download status
      await loadStory();
    } catch (err) {
      console.error('Failed to download story:', err);
      setError('Failed to download story content');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getThemeClasses = () => {
    switch (readingSettings.theme) {
      case 'dark':
        return 'bg-gray-900 text-white';
      case 'sepia':
        return 'bg-yellow-50 text-yellow-900';
      default:
        return 'bg-white text-gray-900';
    }
  };

  const getContentStyle = () => ({
    fontSize: `${readingSettings.fontSize}px`,
    fontFamily: readingSettings.fontFamily === 'serif' ? 'Georgia, serif' : 
                readingSettings.fontFamily === 'sans' ? 'Arial, sans-serif' : 
                'Courier, monospace',
    lineHeight: readingSettings.lineHeight,
    wordSpacing: `${readingSettings.wordSpacing}px`
  });

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading story...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-red-600 text-sm">{error}</div>
          <button
            onClick={loadStory}
            className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        Story not found
      </div>
    );
  }

  return (
    <div className={`${getThemeClasses()} min-h-screen transition-colors duration-300 ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-opacity-95 backdrop-blur-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Book className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">{story.title}</h1>
              <p className="text-sm opacity-70">Level: {story.level}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedText && (
              <button
                onClick={() => setShowNoteDialog(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Add note for selected text"
              >
                <Type className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
              title="Reading settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}

            {story.downloadStatus !== 'downloaded' && (
              <button
                onClick={downloadStory}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Download for offline use"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Reading Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-opacity-90 backdrop-blur-sm rounded-lg border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Font Size</label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={readingSettings.fontSize}
                  onChange={(e) => setReadingSettings(prev => ({ 
                    ...prev, 
                    fontSize: parseInt(e.target.value) 
                  }))}
                  className="w-full"
                />
                <span className="text-xs">{readingSettings.fontSize}px</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Font Family</label>
                <select
                  value={readingSettings.fontFamily}
                  onChange={(e) => setReadingSettings(prev => ({ 
                    ...prev, 
                    fontFamily: e.target.value 
                  }))}
                  className="w-full p-1 rounded border"
                >
                  <option value="serif">Serif</option>
                  <option value="sans">Sans-serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Theme</label>
                <select
                  value={readingSettings.theme}
                  onChange={(e) => setReadingSettings(prev => ({ 
                    ...prev, 
                    theme: e.target.value as ReadingSettings['theme']
                  }))}
                  className="w-full p-1 rounded border"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="sepia">Sepia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Line Height</label>
                <input
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  value={readingSettings.lineHeight}
                  onChange={(e) => setReadingSettings(prev => ({ 
                    ...prev, 
                    lineHeight: parseFloat(e.target.value) 
                  }))}
                  className="w-full"
                />
                <span className="text-xs">{readingSettings.lineHeight}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audio Player */}
      {story.audioUrl && (
        <div className="sticky top-20 z-10 bg-opacity-95 backdrop-blur-sm border-b p-4">
          <audio ref={audioRef} src={story.audioUrl} preload="metadata" />
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleAudio}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              {audioState.isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={restartAudio}
              className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <div className="flex-1">
              <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                <span>{formatTime(audioState.currentTime)}</span>
                <span>{formatTime(audioState.duration)}</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 cursor-pointer">
                <div
                  className="bg-blue-600 rounded-full h-2 transition-all duration-100"
                  style={{
                    width: audioState.duration > 0 
                      ? `${(audioState.currentTime / audioState.duration) * 100}%` 
                      : '0%'
                  }}
                />
              </div>
            </div>

            <select
              value={audioState.playbackRate}
              onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
              className="text-sm p-1 rounded border"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            <button
              onClick={toggleMute}
              className="p-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              {audioState.muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={audioState.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      )}

      {/* Story Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div
          ref={contentRef}
          className="prose max-w-none"
          style={getContentStyle()}
        >
          {typeof story.content === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: story.content }} />
          ) : (
            <div>{JSON.stringify(story.content)}</div>
          )}
        </div>
      </div>

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Add Note</h3>
            
            {selectedText && (
              <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-gray-900">
                <strong>Selected text:</strong> "{selectedText}"
              </div>
            )}
            
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Enter your note..."
              className="w-full h-32 p-3 border rounded-lg resize-none text-gray-900"
              autoFocus
            />
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowNoteDialog(false);
                  setNoteContent('');
                  setSelectedText('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={!noteContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
        Reading time: {formatTime(progress.timeSpent)}
      </div>
    </div>
  );
};

export default OfflineStoryReader;