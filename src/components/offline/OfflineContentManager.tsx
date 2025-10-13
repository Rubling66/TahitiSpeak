import React, { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, HardDrive, Wifi, WifiOff, CheckCircle, XCircle, Clock, Pause, Play, X } from 'lucide-react';
import { offlineManager } from '../../services/offlineManager';
import { contentDownloadManager } from '../../services/contentDownloadManager';
import { offlineDB, OfflineLesson, OfflineStory } from '../../services/offlineDatabase';

interface OfflineContentManagerProps {
  className?: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'story';
  size: number;
  downloadedAt?: Date;
  isDownloaded: boolean;
  category?: string;
  level?: string;
}

interface DownloadItem {
  id: string;
  title: string;
  type: 'lesson' | 'story';
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  error?: string;
}

interface StorageInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

export const OfflineContentManager: React.FC<OfflineContentManagerProps> = ({
  className = ''
}) => {
  const [availableContent, setAvailableContent] = useState<ContentItem[]>([]);
  const [downloadedContent, setDownloadedContent] = useState<ContentItem[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedTab, setSelectedTab] = useState<'available' | 'downloaded' | 'downloads'>('available');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  useEffect(() => {
    loadContent();
    loadStorageInfo();
  }, []);

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

  useEffect(() => {
    // Listen for download progress updates
    const handleDownloadProgress = (progress: any) => {
      setDownloads(prev => prev.map(item => 
        item.id === progress.id 
          ? { ...item, progress: progress.progress, status: progress.status, error: progress.error }
          : item
      ));
    };

    // Set up event listeners for download progress
    contentDownloadManager.onProgress = handleDownloadProgress;

    return () => {
      contentDownloadManager.onProgress = undefined;
    };
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available content (this would typically come from an API)
      // For now, we'll simulate with some sample data
      const sampleLessons: ContentItem[] = [
        {
          id: 'lesson-1',
          title: 'Basic Greetings',
          type: 'lesson',
          size: 15 * 1024 * 1024, // 15MB
          isDownloaded: false,
          category: 'Basics',
          level: 'Beginner'
        },
        {
          id: 'lesson-2',
          title: 'Numbers and Counting',
          type: 'lesson',
          size: 12 * 1024 * 1024, // 12MB
          isDownloaded: false,
          category: 'Basics',
          level: 'Beginner'
        },
        {
          id: 'lesson-3',
          title: 'Family Members',
          type: 'lesson',
          size: 18 * 1024 * 1024, // 18MB
          isDownloaded: false,
          category: 'Vocabulary',
          level: 'Intermediate'
        }
      ];

      const sampleStories: ContentItem[] = [
        {
          id: 'story-1',
          title: 'The Legend of Tahiti',
          type: 'story',
          size: 8 * 1024 * 1024, // 8MB
          isDownloaded: false,
          category: 'Culture',
          level: 'Intermediate'
        },
        {
          id: 'story-2',
          title: 'A Day at the Market',
          type: 'story',
          size: 6 * 1024 * 1024, // 6MB
          isDownloaded: false,
          category: 'Daily Life',
          level: 'Beginner'
        }
      ];

      // Load downloaded content from IndexedDB
      const downloadedLessons = await offlineDB.lessons.toArray();
      const downloadedStories = await offlineDB.stories.toArray();

      const downloadedItems: ContentItem[] = [
        ...downloadedLessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          type: 'lesson' as const,
          size: lesson.content ? new Blob([lesson.content]).size : 0,
          downloadedAt: lesson.downloadedAt,
          isDownloaded: true,
          category: lesson.category,
          level: lesson.level
        })),
        ...downloadedStories.map(story => ({
          id: story.id,
          title: story.title,
          type: 'story' as const,
          size: story.content ? new Blob([story.content]).size : 0,
          downloadedAt: story.downloadedAt,
          isDownloaded: true,
          category: story.category,
          level: story.level
        }))
      ];

      // Mark available content as downloaded if it exists in IndexedDB
      const availableItems = [...sampleLessons, ...sampleStories].map(item => ({
        ...item,
        isDownloaded: downloadedItems.some(downloaded => downloaded.id === item.id),
        downloadedAt: downloadedItems.find(downloaded => downloaded.id === item.id)?.downloadedAt
      }));

      setAvailableContent(availableItems);
      setDownloadedContent(downloadedItems);

      // Load current downloads
      const currentDownloads = await contentDownloadManager.getDownloadQueue();
      setDownloads(currentDownloads.map(item => ({
        id: item.id,
        title: item.title || item.id,
        type: item.type,
        progress: item.progress || 0,
        status: item.status,
        error: item.error
      })));

    } catch (err) {
      console.error('Failed to load content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const usage = await offlineManager.getStorageUsage();
      const total = usage.quota || 0;
      const used = usage.usage || 0;
      const available = total - used;
      const percentage = total > 0 ? (used / total) * 100 : 0;

      setStorageInfo({
        used,
        available,
        total,
        percentage
      });
    } catch (err) {
      console.error('Failed to load storage info:', err);
    }
  };

  const downloadContent = async (item: ContentItem) => {
    try {
      if (!isOnline) {
        setError('Cannot download content while offline');
        return;
      }

      await contentDownloadManager.addToQueue({
        id: item.id,
        type: item.type,
        title: item.title,
        priority: 'normal'
      });

      // Add to downloads list
      setDownloads(prev => [...prev, {
        id: item.id,
        title: item.title,
        type: item.type,
        progress: 0,
        status: 'pending'
      }]);

      // Start download
      await contentDownloadManager.startDownloads();
      
    } catch (err) {
      console.error('Failed to start download:', err);
      setError(err instanceof Error ? err.message : 'Failed to start download');
    }
  };

  const removeContent = async (item: ContentItem) => {
    try {
      if (item.type === 'lesson') {
        await offlineDB.lessons.delete(item.id);
      } else {
        await offlineDB.stories.delete(item.id);
      }

      // Remove associated audio files
      const audioFiles = await offlineDB.audioFiles
        .where('contentId')
        .equals(item.id)
        .toArray();

      for (const audioFile of audioFiles) {
        await offlineDB.audioFiles.delete(audioFile.id);
      }

      await loadContent();
      await loadStorageInfo();
    } catch (err) {
      console.error('Failed to remove content:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove content');
    }
  };

  const pauseDownload = async (downloadId: string) => {
    try {
      await contentDownloadManager.pauseDownload(downloadId);
    } catch (err) {
      console.error('Failed to pause download:', err);
    }
  };

  const resumeDownload = async (downloadId: string) => {
    try {
      await contentDownloadManager.resumeDownload(downloadId);
    } catch (err) {
      console.error('Failed to resume download:', err);
    }
  };

  const cancelDownload = async (downloadId: string) => {
    try {
      await contentDownloadManager.cancelDownload(downloadId);
      setDownloads(prev => prev.filter(item => item.id !== downloadId));
    } catch (err) {
      console.error('Failed to cancel download:', err);
    }
  };

  const clearCache = async () => {
    try {
      await offlineManager.clearCache();
      await loadContent();
      await loadStorageInfo();
    } catch (err) {
      console.error('Failed to clear cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  };

  const optimizeStorage = async () => {
    try {
      await offlineManager.optimizeStorage();
      await loadContent();
      await loadStorageInfo();
    } catch (err) {
      console.error('Failed to optimize storage:', err);
      setError(err instanceof Error ? err.message : 'Failed to optimize storage');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFilteredContent = (content: ContentItem[]) => {
    return content.filter(item => {
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const levelMatch = selectedLevel === 'all' || item.level === selectedLevel;
      return categoryMatch && levelMatch;
    });
  };

  const getCategories = () => {
    const categories = new Set<string>();
    [...availableContent, ...downloadedContent].forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories);
  };

  const getLevels = () => {
    const levels = new Set<string>();
    [...availableContent, ...downloadedContent].forEach(item => {
      if (item.level) levels.add(item.level);
    });
    return Array.from(levels);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading content...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Offline Content</h1>
            <p className="text-gray-600">Manage your downloaded content for offline learning</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <button
              onClick={optimizeStorage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Optimize</span>
            </button>
            
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      </div>

      {/* Storage Info */}
      {storageInfo && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Storage Usage</h3>
            </div>
            <div className="text-sm text-gray-600">
              {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.total)} used
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                storageInfo.percentage > 90 ? 'bg-red-500' :
                storageInfo.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{storageInfo.percentage.toFixed(1)}% used</span>
            <span>{formatFileSize(storageInfo.available)} available</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <div className="text-red-600 text-sm">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setSelectedTab('available')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Available Content ({availableContent.length})
            </button>
            <button
              onClick={() => setSelectedTab('downloaded')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'downloaded'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Downloaded ({downloadedContent.length})
            </button>
            <button
              onClick={() => setSelectedTab('downloads')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'downloads'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Downloads ({downloads.length})
            </button>
          </nav>
        </div>

        {/* Filters */}
        {(selectedTab === 'available' || selectedTab === 'downloaded') && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {getCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Levels</option>
                {getLevels().map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Content Lists */}
        <div className="p-6">
          {selectedTab === 'available' && (
            <div className="space-y-4">
              {getFilteredContent(availableContent.filter(item => !item.isDownloaded)).map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="capitalize">{item.type}</span>
                      {item.category && <span>{item.category}</span>}
                      {item.level && <span>{item.level}</span>}
                      <span>{formatFileSize(item.size)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => downloadContent(item)}
                    disabled={!isOnline}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
              
              {getFilteredContent(availableContent.filter(item => !item.isDownloaded)).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No available content to download
                </div>
              )}
            </div>
          )}

          {selectedTab === 'downloaded' && (
            <div className="space-y-4">
              {getFilteredContent(downloadedContent).map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="capitalize">{item.type}</span>
                      {item.category && <span>{item.category}</span>}
                      {item.level && <span>{item.level}</span>}
                      <span>{formatFileSize(item.size)}</span>
                      {item.downloadedAt && (
                        <span>Downloaded {item.downloadedAt.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeContent(item)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                </div>
              ))}
              
              {getFilteredContent(downloadedContent).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No downloaded content
                </div>
              )}
            </div>
          )}

          {selectedTab === 'downloads' && (
            <div className="space-y-4">
              {downloads.map(download => (
                <div key={download.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {download.status === 'downloading' && <Clock className="h-5 w-5 text-blue-500 animate-spin" />}
                      {download.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {download.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                      {download.status === 'paused' && <Pause className="h-5 w-5 text-yellow-500" />}
                      <h4 className="font-medium text-gray-900">{download.title}</h4>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {download.status === 'downloading' && (
                        <button
                          onClick={() => pauseDownload(download.id)}
                          className="p-1 text-yellow-600 hover:text-yellow-700"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      )}
                      
                      {download.status === 'paused' && (
                        <button
                          onClick={() => resumeDownload(download.id)}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      
                      {(download.status === 'pending' || download.status === 'downloading' || download.status === 'paused') && (
                        <button
                          onClick={() => cancelDownload(download.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span className="capitalize">{download.type}</span>
                    <span className="capitalize">{download.status}</span>
                    <span>{download.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        download.status === 'failed' ? 'bg-red-500' :
                        download.status === 'completed' ? 'bg-green-500' :
                        download.status === 'paused' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${download.progress}%` }}
                    />
                  </div>
                  
                  {download.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {download.error}
                    </div>
                  )}
                </div>
              ))}
              
              {downloads.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No active downloads
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineContentManager;