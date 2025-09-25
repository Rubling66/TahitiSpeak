'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useTranslationManager } from '../../hooks/useTranslationManager';
import { translationService, TranslationEntry, TranslationNamespace } from '../../services/TranslationService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Label } from '../ui/Label';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  RefreshCw, 
  Globe, 
  FileText,
  Save,
  X,
  Check,
  AlertCircle,
  Languages
} from 'lucide-react';

interface TranslationManagerProps {
  className?: string;
}

interface EditingTranslation {
  id: string;
  key: string;
  locale: string;
  namespace: string;
  value: string;
  originalValue: string;
  isNew?: boolean;
}

interface FilterOptions {
  locale: string;
  namespace: string;
  status: 'all' | 'draft' | 'approved' | 'published';
  searchQuery: string;
}

export function TranslationManager({ className }: TranslationManagerProps) {
  const t = useTranslations('admin');
  const { 
    state, 
    loadNamespace, 
    updateTranslation, 
    getAvailableLocales, 
    getAvailableNamespaces,
    clearCache 
  } = useTranslationManager('admin');

  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [namespaces, setNamespaces] = useState<TranslationNamespace[]>([]);
  const [editingTranslation, setEditingTranslation] = useState<EditingTranslation | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    locale: 'en',
    namespace: 'common',
    status: 'all',
    searchQuery: ''
  });

  const availableLocales = getAvailableLocales();
  const availableNamespaces = getAvailableNamespaces();

  /**
   * Load translations for current filters
   */
  const loadTranslations = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll simulate with some mock data
      const mockTranslations: TranslationEntry[] = [
        {
          id: '1',
          key: 'welcome.title',
          locale: filters.locale,
          value: filters.locale === 'en' ? 'Welcome to Tahitian Tutor' : 
                 filters.locale === 'fr' ? 'Bienvenue à Tahitian Tutor' : 
                 'Maeva i Tahitian Tutor',
          context: 'Homepage welcome message',
          metadata: {
            lastModified: new Date(),
            author: 'admin',
            status: 'published',
            version: 1
          }
        },
        {
          id: '2',
          key: 'navigation.courses',
          locale: filters.locale,
          value: filters.locale === 'en' ? 'Courses' : 
                 filters.locale === 'fr' ? 'Cours' : 
                 'Haapiiraa',
          context: 'Navigation menu item',
          metadata: {
            lastModified: new Date(),
            author: 'admin',
            status: 'published',
            version: 1
          }
        }
      ];

      setTranslations(mockTranslations);
    } catch (error) {
      toast.error('Failed to load translations');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Filter translations based on current filters
   */
  const filteredTranslations = useMemo(() => {
    return translations.filter(translation => {
      const matchesSearch = !filters.searchQuery || 
        translation.key.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        translation.value.toLowerCase().includes(filters.searchQuery.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || 
        translation.metadata?.status === filters.status;
      
      return matchesSearch && matchesStatus;
    });
  }, [translations, filters]);

  /**
   * Handle translation edit
   */
  const handleEditTranslation = (translation: TranslationEntry) => {
    setEditingTranslation({
      id: translation.id,
      key: translation.key,
      locale: translation.locale,
      namespace: filters.namespace,
      value: translation.value,
      originalValue: translation.value
    });
  };

  /**
   * Save translation changes
   */
  const handleSaveTranslation = async () => {
    if (!editingTranslation) return;

    try {
      await updateTranslation(
        editingTranslation.key,
        editingTranslation.value,
        {
          locale: editingTranslation.locale,
          namespace: editingTranslation.namespace
        }
      );

      // Update local state
      setTranslations(prev => prev.map(t => 
        t.id === editingTranslation.id 
          ? { ...t, value: editingTranslation.value }
          : t
      ));

      setEditingTranslation(null);
      toast.success('Translation updated successfully');
    } catch (error) {
      toast.error('Failed to update translation');
    }
  };

  /**
   * Create new translation
   */
  const handleCreateTranslation = async (newTranslation: Omit<EditingTranslation, 'id' | 'originalValue'>) => {
    try {
      await updateTranslation(
        newTranslation.key,
        newTranslation.value,
        {
          locale: newTranslation.locale,
          namespace: newTranslation.namespace
        }
      );

      // Add to local state
      const translation: TranslationEntry = {
        id: Date.now().toString(),
        key: newTranslation.key,
        locale: newTranslation.locale,
        value: newTranslation.value,
        metadata: {
          lastModified: new Date(),
          author: 'admin',
          status: 'draft',
          version: 1
        }
      };

      setTranslations(prev => [...prev, translation]);
      setIsCreateDialogOpen(false);
      toast.success('Translation created successfully');
    } catch (error) {
      toast.error('Failed to create translation');
    }
  };

  /**
   * Export translations
   */
  const handleExportTranslations = () => {
    const exportData = {
      locale: filters.locale,
      namespace: filters.namespace,
      translations: filteredTranslations,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations-${filters.locale}-${filters.namespace}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Translations exported successfully');
  };

  /**
   * Import translations
   */
  const handleImportTranslations = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.translations && Array.isArray(importData.translations)) {
          setTranslations(prev => {
            const existingKeys = new Set(prev.map(t => `${t.locale}:${t.key}`));
            const newTranslations = importData.translations.filter(
              (t: TranslationEntry) => !existingKeys.has(`${t.locale}:${t.key}`)
            );
            return [...prev, ...newTranslations];
          });
          toast.success(`Imported ${importData.translations.length} translations`);
        } else {
          toast.error('Invalid translation file format');
        }
      } catch (error) {
        toast.error('Failed to parse translation file');
      }
    };
    reader.readAsText(file);
  };

  // Load translations when filters change
  useEffect(() => {
    loadTranslations();
  }, [filters.locale, filters.namespace]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('translations.title')}</h1>
          <p className="text-muted-foreground">
            {t('translations.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearCache()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportTranslations}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportTranslations}
            />
          </label>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Translation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Locale</Label>
              <Select
                value={filters.locale}
                onValueChange={(value) => setFilters(prev => ({ ...prev, locale: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLocales.map(locale => (
                    <SelectItem key={locale} value={locale}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {locale.toUpperCase()}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Namespace</Label>
              <Select
                value={filters.namespace}
                onValueChange={(value) => setFilters(prev => ({ ...prev, namespace: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableNamespaces.map(namespace => (
                    <SelectItem key={namespace} value={namespace}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {namespace}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search translations..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Translation List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Translations
            </div>
            <Badge variant="secondary">
              {filteredTranslations.length} translations
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading translations...</span>
            </div>
          ) : filteredTranslations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No translations found</p>
              <p className="text-sm">Try adjusting your filters or create a new translation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTranslations.map((translation) => (
                <div
                  key={translation.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {translation.key}
                        </code>
                        <Badge 
                          variant={translation.metadata?.status === 'published' ? 'default' : 'secondary'}
                        >
                          {translation.metadata?.status || 'draft'}
                        </Badge>
                      </div>
                      
                      {editingTranslation?.id === translation.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingTranslation.value}
                            onChange={(e) => setEditingTranslation(prev => 
                              prev ? { ...prev, value: e.target.value } : null
                            )}
                            className="min-h-[80px]"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveTranslation}
                              disabled={editingTranslation.value === editingTranslation.originalValue}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingTranslation(null)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{translation.value}</p>
                      )}
                      
                      {translation.context && (
                        <p className="text-xs text-muted-foreground">
                          Context: {translation.context}
                        </p>
                      )}
                    </div>
                    
                    {editingTranslation?.id !== translation.id && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTranslation(translation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Translation Dialog */}
      <CreateTranslationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTranslation={handleCreateTranslation}
        availableLocales={availableLocales}
        availableNamespaces={availableNamespaces}
        defaultLocale={filters.locale}
        defaultNamespace={filters.namespace}
      />
    </div>
  );
}

// Create Translation Dialog Component
interface CreateTranslationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTranslation: (translation: Omit<EditingTranslation, 'id' | 'originalValue'>) => void;
  availableLocales: string[];
  availableNamespaces: string[];
  defaultLocale: string;
  defaultNamespace: string;
}

function CreateTranslationDialog({
  open,
  onOpenChange,
  onCreateTranslation,
  availableLocales,
  availableNamespaces,
  defaultLocale,
  defaultNamespace
}: CreateTranslationDialogProps) {
  const [formData, setFormData] = useState({
    key: '',
    locale: defaultLocale,
    namespace: defaultNamespace,
    value: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.key && formData.value) {
      onCreateTranslation(formData);
      setFormData({ key: '', locale: defaultLocale, namespace: defaultNamespace, value: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Translation</DialogTitle>
          <DialogDescription>
            Add a new translation entry to the selected namespace and locale.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locale">Locale</Label>
              <Select
                value={formData.locale}
                onValueChange={(value) => setFormData(prev => ({ ...prev, locale: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLocales.map(locale => (
                    <SelectItem key={locale} value={locale}>
                      {locale.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="namespace">Namespace</Label>
              <Select
                value={formData.namespace}
                onValueChange={(value) => setFormData(prev => ({ ...prev, namespace: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableNamespaces.map(namespace => (
                    <SelectItem key={namespace} value={namespace}>
                      {namespace}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="key">Translation Key</Label>
            <Input
              id="key"
              placeholder="e.g., welcome.title"
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">Translation Value</Label>
            <Textarea
              id="value"
              placeholder="Enter the translated text..."
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              className="min-h-[100px]"
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.key || !formData.value}>
              <Plus className="h-4 w-4 mr-2" />
              Create Translation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TranslationManager;