// components/ebooks/EbookReader.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Ebook, 
  EbookChapter, 
  EbookAnnotation, 
  EbookBookmark,
  EbookProgress 
} from '@/types/ebook';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Bookmark, 
  BookmarkCheck,
  Highlighter, 
  Volume2, 
  VolumeX,
  Search,
  List,
  Type,
  Sun,
  Moon,
  Palette,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MessageSquare,
  X,
  Plus,
  Check
} from 'lucide-react';

interface EbookReaderProps {
  ebook: Ebook;
  initialProgress?: EbookProgress;
  onProgressUpdate?: (progress: EbookProgress) => void;
  onAnnotationAdd?: (annotation: Omit<EbookAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onBookmarkAdd?: (bookmark: Omit<EbookBookmark, 'id' | 'createdAt'>) => void;
}

export function EbookReader({ 
  ebook, 
  initialProgress, 
  onProgressUpdate, 
  onAnnotationAdd, 
  onBookmarkAdd 
}: EbookReaderProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [annotationNote, setAnnotationNote] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [settings, setSettings] = useState(ebook.settings);
  const [annotations, setAnnotations] = useState<EbookAnnotation[]>([]);
  const [bookmarks, setBookmarks] = useState<EbookBookmark[]>([]);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentChapter = ebook.chapters[currentChapterIndex];

  useEffect(() => {
    if (initialProgress) {
      const chapterIndex = ebook.chapters.findIndex(ch => ch.id === initialProgress.currentChapter);
      if (chapterIndex !== -1) {
        setCurrentChapterIndex(chapterIndex);
      }
    }
  }, [initialProgress, ebook.chapters]);

  const handleNextChapter = () => {
    if (currentChapterIndex < ebook.chapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
      updateProgress();
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
      updateProgress();
    }
  };

  const handleChapterSelect = (chapterIndex: number) => {
    setCurrentChapterIndex(chapterIndex);
    setShowTOC(false);
    updateProgress();
  };

  const updateProgress = () => {
    const progress: EbookProgress = {
      userId: 'current-user',
      ebookId: ebook.id,
      currentChapter: currentChapter.id,
      currentPosition: 0,
      completedChapters: ebook.chapters.slice(0, currentChapterIndex).map(ch => ch.id),
      totalTimeSpent: (initialProgress?.totalTimeSpent || 0) + 1,
      lastReadAt: new Date().toISOString(),
      progressPercentage: Math.round((currentChapterIndex / ebook.chapters.length) * 100),
      exerciseScores: initialProgress?.exerciseScores || {}
    };
    onProgressUpdate?.(progress);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
      setShowAnnotationDialog(true);
    }
  };

  const handleAddAnnotation = () => {
    if (selectedText && annotationNote) {
      const annotation: Omit<EbookAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
        chapterId: currentChapter.id,
        userId: 'current-user',
        text: selectedText,
        note: annotationNote,
        position: { start: 0, end: selectedText.length },
        color: '#ffeb3b'
      };
      onAnnotationAdd?.(annotation);
      setAnnotationNote('');
      setSelectedText('');
      setShowAnnotationDialog(false);
    }
  };

  const handleBookmark = () => {
    if (!isBookmarked) {
      const bookmark: Omit<EbookBookmark, 'id' | 'createdAt'> = {
        chapterId: currentChapter.id,
        userId: 'current-user',
        title: `${currentChapter.title} - Page ${currentChapterIndex + 1}`,
        position: 0
      };
      onBookmarkAdd?.(bookmark);
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleAudioToggle = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const results: any[] = [];
      ebook.chapters.forEach((chapter, chapterIndex) => {
        const matches = chapter.content.toLowerCase().indexOf(term.toLowerCase());
        if (matches !== -1) {
          results.push({
            chapterIndex,
            chapterTitle: chapter.title,
            context: chapter.content.substring(Math.max(0, matches - 50), matches + 50)
          });
        }
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'extra-large': return 'text-xl';
      default: return 'text-base';
    }
  };

  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'dark': return 'bg-gray-900 text-white';
      case 'sepia': return 'bg-yellow-50 text-yellow-900';
      default: return 'bg-white text-gray-900';
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClasses()}`}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowTOC(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <List size={20} />
            </button>
            <div>
              <h1 className="font-semibold text-gray-900">{ebook.metadata.title}</h1>
              <p className="text-sm text-gray-600">{currentChapter.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-48"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleChapterSelect(result.chapterIndex)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{result.chapterTitle}</div>
                      <div className="text-xs text-gray-600 truncate">{result.context}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Audio Controls */}
            {currentChapter.audioUrl && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleAudioToggle}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <audio
                  ref={audioRef}
                  src={currentChapter.audioUrl}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            )}

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg ${isBookmarked ? 'text-blue-600 bg-blue-50' : 'hover:bg-gray-100'}`}
            >
              {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>

            {/* Annotations */}
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <MessageSquare size={16} />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 max-w-6xl mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentChapterIndex + 1) / ebook.chapters.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Chapter {currentChapterIndex + 1} of {ebook.chapters.length}</span>
            <span>{Math.round(((currentChapterIndex + 1) / ebook.chapters.length) * 100)}% complete</span>
          </div>
        </div>
      </div>

      <div className="flex max-w-6xl mx-auto">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div 
            ref={contentRef}
            className={`
              prose max-w-none
              ${getFontSizeClass()}
              ${settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}
            `}
            style={{ 
              lineHeight: settings.lineHeight,
              margin: `0 ${settings.margin}px`
            }}
            onMouseUp={handleTextSelection}
            dangerouslySetInnerHTML={{ __html: currentChapter.content.replace(/\n/g, '<br>') }}
          />

          {/* Chapter Exercises */}
          {currentChapter.exercises && currentChapter.exercises.length > 0 && (
            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Chapter Exercises</h3>
              <div className="space-y-4">
                {currentChapter.exercises.map((exercise, index) => (
                  <div key={exercise.id} className="p-4 bg-white rounded-lg">
                    <h4 className="font-medium mb-2">Exercise {index + 1}</h4>
                    <p className="mb-3">{exercise.question}</p>
                    {exercise.options && (
                      <div className="space-y-2">
                        {exercise.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center gap-2">
                            <input type="radio" name={`exercise-${exercise.id}`} value={option} />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Submit Answer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevChapter}
              disabled={currentChapterIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous Chapter
            </button>

            <span className="text-sm text-gray-600">
              {currentChapter.duration && `${currentChapter.duration} min read`}
            </span>

            <button
              onClick={handleNextChapter}
              disabled={currentChapterIndex === ebook.chapters.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Chapter
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Annotations Sidebar */}
        {showAnnotations && (
          <div className="w-80 border-l border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Annotations</h3>
              <button
                onClick={() => setShowAnnotations(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {annotations.map((annotation) => (
                <div key={annotation.id} className="p-3 bg-yellow-50 rounded-lg">
                  <div className="font-medium text-sm mb-1">"{annotation.text}"</div>
                  <div className="text-sm text-gray-600">{annotation.note}</div>
                </div>
              ))}
              {annotations.length === 0 && (
                <p className="text-gray-500 text-sm">No annotations yet. Select text to add annotations.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table of Contents Modal */}
      {showTOC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Table of Contents</h3>
              <button
                onClick={() => setShowTOC(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {ebook.chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterSelect(index)}
                  className={`
                    w-full text-left p-3 rounded-lg hover:bg-gray-50
                    ${index === currentChapterIndex ? 'bg-blue-50 text-blue-700' : ''}
                  `}
                >
                  <div className="font-medium">{chapter.title}</div>
                  <div className="text-sm text-gray-600">
                    {chapter.duration && `${chapter.duration} min`} • {chapter.wordCount} words
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reading Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, fontSize: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'sepia', label: 'Sepia', icon: Palette }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setSettings(prev => ({ ...prev, theme: value as any }))}
                      className={`
                        p-3 border rounded-lg flex flex-col items-center gap-1
                        ${settings.theme === value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                      `}
                    >
                      <Icon size={16} />
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-sm font-medium mb-2">Line Height</label>
                <input
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => setSettings(prev => ({ ...prev, lineHeight: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600">{settings.lineHeight}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Annotation Dialog */}
      {showAnnotationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Annotation</h3>
              <button
                onClick={() => setShowAnnotationDialog(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Selected Text</label>
                <div className="p-3 bg-yellow-50 rounded-lg text-sm">"{selectedText}"</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Your Note</label>
                <textarea
                  value={annotationNote}
                  onChange={(e) => setAnnotationNote(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Add your note here..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAnnotationDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAnnotation}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Annotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}