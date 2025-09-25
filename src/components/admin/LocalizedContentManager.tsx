'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Filter,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Languages
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';
import { useTranslationManager } from '@/hooks/useTranslationManager';
import { TranslationService } from '@/services/TranslationService';
import { logger } from '@/utils/logger';

interface LocalizedContent {
  id: string;
  type: 'course' | 'lesson' | 'quiz' | 'resource';
  sourceId: string;
  locale: string;
  title: string;
  description: string;
  content: string;
  metadata: Record<string, any>;
  status: 'draft' | 'review' | 'approved' | 'published';
  translatedFrom?: string;
  translatedBy?: string;
  translatedAt?: string;
  lastModified: string;
  version: number;
}

interface TranslationProject {
  id: string;
  name: string;
  sourceLocale: string;
  targetLocales: string[];
  contentType: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  createdAt: string;
  deadline?: string;
}

interface ContentFilter {
  type?: string;
  locale?: string;
  status?: string;
  search?: string;
}

const CONTENT_TYPES = [
  { value: 'course', label: 'Courses', icon: '📚' },
  { value: 'lesson', label: 'Lessons', icon: '📖' },
  { value: 'quiz', label: 'Quizzes', icon: '❓' },
  { value: 'resource', label: 'Resources', icon: '📄' }
];

const CONTENT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray', icon: Clock },
  { value: 'review', label: 'In Review', color: 'yellow', icon: AlertCircle },
  { value: 'approved', label: 'Approved', color: 'green', icon: CheckCircle },
  { value: 'published', label: 'Published', color: 'blue', icon: Globe }
];

const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ty', name: 'Tahitian', flag: '🇵🇫' }
];

export function LocalizedContentManager() {
  const [contents, setContents] = useState<LocalizedContent[]>([]);
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [selectedContent, setSelectedContent] = useState<LocalizedContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ContentFilter>({});
  const [activeTab, setActiveTab] = useState<'content' | 'projects'>('content');
  
  const { t, formatMessage } = useI18n();
  const { 
    translations, 
    updateTranslation, 
    createTranslation, 
    deleteTranslation,
    exportTranslations,
    importTranslations,
    isLoading: translationLoading
  } = useTranslationManager();

  // Load content data
  useEffect(() => {
    loadLocalizedContent();
    loadTranslationProjects();
  }, []);

  const loadLocalizedContent = async () => {
    try {
      setIsLoading(true);
      // Mock data - replace with actual API call
      const mockContents: LocalizedContent[] = [
        {
          id: '1',
          type: 'course',
          sourceId: 'course-1',
          locale: 'en',
          title: 'Introduction to Tahitian Language',
          description: 'Learn the basics of Tahitian language and culture',
          content: 'Course content here...',
          metadata: { difficulty: 'beginner', duration: '4 weeks' },
          status: 'published',
          lastModified: new Date().toISOString(),
          version: 1
        },
        {
          id: '2',
          type: 'course',
          sourceId: 'course-1',
          locale: 'fr',
          title: 'Introduction à la langue tahitienne',
          description: 'Apprenez les bases de la langue et de la culture tahitiennes',
          content: 'Contenu du cours ici...',
          metadata: { difficulty: 'débutant', duration: '4 semaines' },
          status: 'review',
          translatedFrom: 'en',
          translatedBy: 'translator-1',
          translatedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: 1
        }
      ];
      setContents(mockContents);
    } catch (error) {
      logger.error('Failed to load localized content', { error });
      toast.error(t('admin.content.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadTranslationProjects = async () => {
    try {
      // Mock data - replace with actual API call
      const mockProjects: TranslationProject[] = [
        {
          id: 'proj-1',
          name: 'Course Translation - Q1 2024',
          sourceLocale: 'en',
          targetLocales: ['fr', 'ty'],
          contentType: 'course',
          status: 'active',
          progress: 65,
          createdAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setProjects(mockProjects);
    } catch (error) {
      logger.error('Failed to load translation projects', { error });
    }
  };

  const filteredContents = contents.filter(content => {
    if (filter.type && content.type !== filter.type) return false;
    if (filter.locale && content.locale !== filter.locale) return false;
    if (filter.status && content.status !== filter.status) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        content.title.toLowerCase().includes(searchLower) ||
        content.description.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleSaveContent = async (content: LocalizedContent) => {
    try {
      setIsLoading(true);
      
      // Update or create content
      if (content.id) {
        // Update existing
        setContents(prev => prev.map(c => c.id === content.id ? content : c));
        toast.success(t('admin.content.updateSuccess'));
      } else {
        // Create new
        const newContent = { ...content, id: Date.now().toString() };
        setContents(prev => [...prev, newContent]);
        toast.success(t('admin.content.createSuccess'));
      }
      
      setSelectedContent(null);
      setIsEditing(false);
      
      logger.info('Content saved successfully', { contentId: content.id, type: content.type });
    } catch (error) {
      logger.error('Failed to save content', { error, contentId: content.id });
      toast.error(t('admin.content.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm(t('admin.content.deleteConfirm'))) return;
    
    try {
      setContents(prev => prev.filter(c => c.id !== contentId));
      toast.success(t('admin.content.deleteSuccess'));
      logger.info('Content deleted successfully', { contentId });
    } catch (error) {
      logger.error('Failed to delete content', { error, contentId });
      toast.error(t('admin.content.deleteError'));
    }
  };

  const handleCreateTranslation = async (sourceContent: LocalizedContent, targetLocale: string) => {
    try {
      setIsLoading(true);
      
      const newTranslation: LocalizedContent = {
        ...sourceContent,
        id: Date.now().toString(),
        locale: targetLocale,
        title: `[${targetLocale.toUpperCase()}] ${sourceContent.title}`,
        description: `[Translation needed] ${sourceContent.description}`,
        content: `[Translation needed] ${sourceContent.content}`,
        status: 'draft',
        translatedFrom: sourceContent.locale,
        lastModified: new Date().toISOString(),
        version: 1
      };
      
      setContents(prev => [...prev, newTranslation]);
      toast.success(t('admin.content.translationCreated'));
      
      logger.info('Translation created', { 
        sourceId: sourceContent.id, 
        targetLocale,
        translationId: newTranslation.id 
      });
    } catch (error) {
      logger.error('Failed to create translation', { error, sourceContent, targetLocale });
      toast.error(t('admin.content.translationError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportContent = async () => {
    try {
      const exportData = {
        contents: filteredContents,
        exportedAt: new Date().toISOString(),
        filter
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `localized-content-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(t('admin.content.exportSuccess'));
    } catch (error) {
      logger.error('Failed to export content', { error });
      toast.error(t('admin.content.exportError'));
    }
  };

  const renderContentList = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('admin.content.searchPlaceholder')}
            value={filter.search || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className="px-3 py-1 border rounded-md text-sm"
          />
        </div>
        
        <select
          value={filter.type || ''}
          onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value || undefined }))}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="">{t('admin.content.allTypes')}</option>
          {CONTENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
        
        <select
          value={filter.locale || ''}
          onChange={(e) => setFilter(prev => ({ ...prev, locale: e.target.value || undefined }))}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="">{t('admin.content.allLanguages')}</option>
          {SUPPORTED_LOCALES.map(locale => (
            <option key={locale.code} value={locale.code}>
              {locale.flag} {locale.name}
            </option>
          ))}
        </select>
        
        <select
          value={filter.status || ''}
          onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value || undefined }))}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="">{t('admin.content.allStatuses')}</option>
          {CONTENT_STATUSES.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        
        <button
          onClick={handleExportContent}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          {t('admin.content.export')}
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContents.map(content => {
          const statusConfig = CONTENT_STATUSES.find(s => s.value === content.status);
          const StatusIcon = statusConfig?.icon || Clock;
          const locale = SUPPORTED_LOCALES.find(l => l.code === content.locale);
          
          return (
            <div key={content.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {CONTENT_TYPES.find(t => t.value === content.type)?.icon}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {locale?.flag} {locale?.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <StatusIcon className={cn(
                    "w-4 h-4",
                    statusConfig?.color === 'green' && "text-green-600",
                    statusConfig?.color === 'yellow' && "text-yellow-600",
                    statusConfig?.color === 'blue' && "text-blue-600",
                    statusConfig?.color === 'gray' && "text-gray-600"
                  )} />
                  <span className="text-xs text-gray-500">{statusConfig?.label}</span>
                </div>
              </div>
              
              <h3 className="font-medium mb-1 line-clamp-2">{content.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {content.description}
              </p>
              
              {content.translatedFrom && (
                <div className="text-xs text-blue-600 mb-2">
                  {t('admin.content.translatedFrom', { locale: content.translatedFrom })}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  v{content.version} • {new Date(content.lastModified).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedContent(content);
                      setIsEditing(true);
                    }}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteContent(content.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredContents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('admin.content.noContent')}</p>
        </div>
      )}
    </div>
  );

  const renderProjectsList = () => (
    <div className="space-y-4">
      {projects.map(project => (
        <div key={project.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium">{project.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {SUPPORTED_LOCALES.find(l => l.code === project.sourceLocale)?.name} → 
                {project.targetLocales.map(locale => 
                  SUPPORTED_LOCALES.find(l => l.code === locale)?.name
                ).join(', ')}
              </p>
            </div>
            <span className={cn(
              "px-2 py-1 text-xs rounded",
              project.status === 'active' && "bg-green-100 text-green-800",
              project.status === 'completed' && "bg-blue-100 text-blue-800",
              project.status === 'paused' && "bg-yellow-100 text-yellow-800"
            )}>
              {project.status}
            </span>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{t('admin.content.progress')}</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{t('admin.content.created')}: {new Date(project.createdAt).toLocaleDateString()}</span>
            {project.deadline && (
              <span>{t('admin.content.deadline')}: {new Date(project.deadline).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.content.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('admin.content.description')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedContent({
                id: '',
                type: 'course',
                sourceId: '',
                locale: 'en',
                title: '',
                description: '',
                content: '',
                metadata: {},
                status: 'draft',
                lastModified: new Date().toISOString(),
                version: 1
              });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            {t('admin.content.create')}
          </button>
          
          <button
            onClick={loadLocalizedContent}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('content')}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'content'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {t('admin.content.contentTab')}
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'projects'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {t('admin.content.projectsTab')}
          </button>
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="ml-2">{t('common.loading')}</span>
        </div>
      ) : (
        <div>
          {activeTab === 'content' && renderContentList()}
          {activeTab === 'projects' && renderProjectsList()}
        </div>
      )}
    </div>
  );
}

export default LocalizedContentManager;