import { DataService } from './DataService';
import {
  Language,
  TranslationKey,
  Translation,
  TranslationProject,
  TranslationMemory,
  LocalizationRule,
  ContentLocalization,
  TranslationProvider,
  TranslationJob,
  LocalizationMetrics,
  RTLConfiguration,
  LocalizationAPI
} from '../types/localization';

class LocalizationService implements LocalizationAPI {
  private dataService: DataService;
  private languages: Language[] = [];
  private translationKeys: TranslationKey[] = [];
  private translations: Translation[] = [];
  private translationProjects: TranslationProject[] = [];
  private translationMemory: TranslationMemory[] = [];
  private localizationRules: LocalizationRule[] = [];
  private contentLocalizations: ContentLocalization[] = [];
  private translationProviders: TranslationProvider[] = [];
  private translationJobs: TranslationJob[] = [];
  private rtlConfigurations: RTLConfiguration[] = [];

  constructor() {
    this.dataService = new DataService();
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Sample languages
    this.languages = [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
        enabled: true,
        isDefault: true
      },
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        direction: 'ltr',
        enabled: true,
        isDefault: false
      },
      {
        code: 'ty',
        name: 'Tahitian',
        nativeName: 'Reo Tahiti',
        direction: 'ltr',
        enabled: true,
        isDefault: false
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        direction: 'rtl',
        enabled: false,
        isDefault: false
      }
    ];

    // Sample translation keys
    this.translationKeys = [
      {
        id: 'key1',
        key: 'welcome.title',
        context: 'Homepage welcome message',
        description: 'Main title displayed on the welcome page',
        maxLength: 50,
        pluralizable: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'key2',
        key: 'course.lessons',
        context: 'Course content',
        description: 'Number of lessons in a course',
        pluralizable: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    // Sample translations
    this.translations = [
      {
        id: 'trans1',
        keyId: 'key1',
        languageCode: 'en',
        value: 'Welcome to Tahitian Tutor',
        status: 'approved',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'trans2',
        keyId: 'key1',
        languageCode: 'fr',
        value: 'Bienvenue au Tuteur Tahitien',
        status: 'approved',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'trans3',
        keyId: 'key2',
        languageCode: 'en',
        value: '{count} lesson',
        pluralForms: {
          one: '{count} lesson',
          other: '{count} lessons'
        },
        status: 'approved',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    // Sample translation providers
    this.translationProviders = [
      {
        id: 'provider1',
        name: 'Google Translate',
        type: 'google',
        supportedLanguages: ['en', 'fr', 'ty', 'ar', 'es', 'de'],
        maxCharacters: 5000,
        costPerCharacter: 0.00002,
        enabled: true,
        config: {
          apiVersion: 'v3',
          model: 'base'
        }
      },
      {
        id: 'provider2',
        name: 'DeepL',
        type: 'deepl',
        supportedLanguages: ['en', 'fr', 'de', 'es'],
        maxCharacters: 1000,
        costPerCharacter: 0.00005,
        enabled: true,
        config: {
          formality: 'default'
        }
      }
    ];

    // Sample RTL configuration
    this.rtlConfigurations = [
      {
        languageCode: 'ar',
        textDirection: 'rtl',
        layoutMirror: true,
        fontFamily: 'Noto Sans Arabic',
        fontSize: '16px',
        lineHeight: '1.6',
        textAlign: 'right',
        customCSS: 'body[dir="rtl"] { font-family: "Noto Sans Arabic", sans-serif; }'
      }
    ];
  }

  // Language Management
  async getLanguages(): Promise<Language[]> {
    return this.languages;
  }

  async addLanguage(language: Omit<Language, 'enabled'>): Promise<Language> {
    const newLanguage: Language = {
      ...language,
      enabled: true
    };
    this.languages.push(newLanguage);
    return newLanguage;
  }

  async updateLanguage(code: string, updates: Partial<Language>): Promise<Language> {
    const index = this.languages.findIndex(lang => lang.code === code);
    if (index === -1) throw new Error('Language not found');
    
    this.languages[index] = { ...this.languages[index], ...updates };
    return this.languages[index];
  }

  async removeLanguage(code: string): Promise<void> {
    this.languages = this.languages.filter(lang => lang.code !== code);
  }

  async setDefaultLanguage(code: string): Promise<void> {
    this.languages.forEach(lang => {
      lang.isDefault = lang.code === code;
    });
  }

  // Translation Keys
  async getTranslationKeys(projectId?: string): Promise<TranslationKey[]> {
    return this.translationKeys;
  }

  async addTranslationKey(key: Omit<TranslationKey, 'id' | 'createdAt' | 'updatedAt'>): Promise<TranslationKey> {
    const newKey: TranslationKey = {
      ...key,
      id: `key_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.translationKeys.push(newKey);
    return newKey;
  }

  async updateTranslationKey(id: string, updates: Partial<TranslationKey>): Promise<TranslationKey> {
    const index = this.translationKeys.findIndex(key => key.id === id);
    if (index === -1) throw new Error('Translation key not found');
    
    this.translationKeys[index] = {
      ...this.translationKeys[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.translationKeys[index];
  }

  async removeTranslationKey(id: string): Promise<void> {
    this.translationKeys = this.translationKeys.filter(key => key.id !== id);
    this.translations = this.translations.filter(trans => trans.keyId !== id);
  }

  async importTranslationKeys(keys: Omit<TranslationKey, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TranslationKey[]> {
    const importedKeys: TranslationKey[] = [];
    for (const key of keys) {
      const newKey = await this.addTranslationKey(key);
      importedKeys.push(newKey);
    }
    return importedKeys;
  }

  // Translations
  async getTranslations(keyId?: string, languageCode?: string): Promise<Translation[]> {
    let filtered = this.translations;
    if (keyId) filtered = filtered.filter(trans => trans.keyId === keyId);
    if (languageCode) filtered = filtered.filter(trans => trans.languageCode === languageCode);
    return filtered;
  }

  async addTranslation(translation: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Translation> {
    const newTranslation: Translation = {
      ...translation,
      id: `trans_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.translations.push(newTranslation);
    return newTranslation;
  }

  async updateTranslation(id: string, updates: Partial<Translation>): Promise<Translation> {
    const index = this.translations.findIndex(trans => trans.id === id);
    if (index === -1) throw new Error('Translation not found');
    
    this.translations[index] = {
      ...this.translations[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.translations[index];
  }

  async removeTranslation(id: string): Promise<void> {
    this.translations = this.translations.filter(trans => trans.id !== id);
  }

  async bulkUpdateTranslations(updates: { id: string; updates: Partial<Translation> }[]): Promise<Translation[]> {
    const updatedTranslations: Translation[] = [];
    for (const update of updates) {
      const translation = await this.updateTranslation(update.id, update.updates);
      updatedTranslations.push(translation);
    }
    return updatedTranslations;
  }

  // Translation Projects
  async getTranslationProjects(): Promise<TranslationProject[]> {
    return this.translationProjects;
  }

  async createTranslationProject(project: Omit<TranslationProject, 'id' | 'progress' | 'createdAt' | 'updatedAt'>): Promise<TranslationProject> {
    const newProject: TranslationProject = {
      ...project,
      id: `project_${Date.now()}`,
      progress: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.translationProjects.push(newProject);
    return newProject;
  }

  async updateTranslationProject(id: string, updates: Partial<TranslationProject>): Promise<TranslationProject> {
    const index = this.translationProjects.findIndex(project => project.id === id);
    if (index === -1) throw new Error('Translation project not found');
    
    this.translationProjects[index] = {
      ...this.translationProjects[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.translationProjects[index];
  }

  async deleteTranslationProject(id: string): Promise<void> {
    this.translationProjects = this.translationProjects.filter(project => project.id !== id);
  }

  async calculateProjectProgress(id: string): Promise<Record<string, number>> {
    const project = this.translationProjects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');

    const progress: Record<string, number> = {};
    for (const langCode of project.targetLanguages) {
      const totalKeys = this.translationKeys.length;
      const translatedKeys = this.translations.filter(
        trans => trans.languageCode === langCode && trans.status === 'approved'
      ).length;
      progress[langCode] = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;
    }
    return progress;
  }

  // Translation Memory
  async searchTranslationMemory(sourceText: string, sourceLanguage: string, targetLanguage: string): Promise<TranslationMemory[]> {
    return this.translationMemory.filter(
      mem => mem.sourceLanguage === sourceLanguage && 
             mem.targetLanguage === targetLanguage &&
             mem.sourceText.toLowerCase().includes(sourceText.toLowerCase())
    );
  }

  async addToTranslationMemory(memory: Omit<TranslationMemory, 'id' | 'createdAt'>): Promise<TranslationMemory> {
    const newMemory: TranslationMemory = {
      ...memory,
      id: `mem_${Date.now()}`,
      createdAt: new Date()
    };
    this.translationMemory.push(newMemory);
    return newMemory;
  }

  async updateTranslationMemory(id: string, updates: Partial<TranslationMemory>): Promise<TranslationMemory> {
    const index = this.translationMemory.findIndex(mem => mem.id === id);
    if (index === -1) throw new Error('Translation memory not found');
    
    this.translationMemory[index] = { ...this.translationMemory[index], ...updates };
    return this.translationMemory[index];
  }

  async clearTranslationMemory(languagePair?: { source: string; target: string }): Promise<void> {
    if (languagePair) {
      this.translationMemory = this.translationMemory.filter(
        mem => !(mem.sourceLanguage === languagePair.source && mem.targetLanguage === languagePair.target)
      );
    } else {
      this.translationMemory = [];
    }
  }

  // Auto-Translation
  async autoTranslate(keyIds: string[], sourceLanguage: string, targetLanguages: string[], providerId: string): Promise<TranslationJob> {
    const job: TranslationJob = {
      id: `job_${Date.now()}`,
      projectId: 'auto_translate',
      sourceLanguage,
      targetLanguage: targetLanguages.join(','),
      contentIds: keyIds,
      providerId,
      status: 'queued',
      progress: 0,
      estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.translationJobs.push(job);
    
    // Simulate processing
    setTimeout(() => {
      job.status = 'processing';
      job.progress = 50;
    }, 1000);
    
    setTimeout(() => {
      job.status = 'completed';
      job.progress = 100;
    }, 5000);
    
    return job;
  }

  async batchTranslate(projectId: string, targetLanguages: string[], providerId: string): Promise<TranslationJob[]> {
    const jobs: TranslationJob[] = [];
    for (const targetLang of targetLanguages) {
      const job = await this.autoTranslate(
        this.translationKeys.map(k => k.id),
        'en',
        [targetLang],
        providerId
      );
      jobs.push(job);
    }
    return jobs;
  }

  // RTL Support
  async getRTLConfiguration(languageCode: string): Promise<RTLConfiguration | null> {
    return this.rtlConfigurations.find(config => config.languageCode === languageCode) || null;
  }

  async setRTLConfiguration(config: RTLConfiguration): Promise<RTLConfiguration> {
    const index = this.rtlConfigurations.findIndex(c => c.languageCode === config.languageCode);
    if (index >= 0) {
      this.rtlConfigurations[index] = config;
    } else {
      this.rtlConfigurations.push(config);
    }
    return config;
  }

  async generateRTLCSS(languageCode: string): Promise<string> {
    const config = await this.getRTLConfiguration(languageCode);
    if (!config) return '';
    
    return `
      [dir="rtl"] {
        direction: rtl;
        text-align: ${config.textAlign};
        font-family: ${config.fontFamily || 'inherit'};
        font-size: ${config.fontSize || 'inherit'};
        line-height: ${config.lineHeight || 'inherit'};
      }
      
      [dir="rtl"] .flex {
        flex-direction: row-reverse;
      }
      
      [dir="rtl"] .ml-auto {
        margin-left: 0;
        margin-right: auto;
      }
      
      [dir="rtl"] .mr-auto {
        margin-right: 0;
        margin-left: auto;
      }
      
      ${config.customCSS || ''}
    `;
  }

  // Metrics and Analytics
  async getLocalizationMetrics(projectId?: string, dateRange?: { start: Date; end: Date }): Promise<LocalizationMetrics> {
    const totalKeys = this.translationKeys.length;
    const translatedKeys = this.translations.filter(t => t.status !== 'pending').length;
    const reviewedKeys = this.translations.filter(t => t.status === 'reviewed' || t.status === 'approved').length;
    const approvedKeys = this.translations.filter(t => t.status === 'approved').length;

    const languageProgress: Record<string, any> = {};
    for (const lang of this.languages) {
      const langTranslations = this.translations.filter(t => t.languageCode === lang.code);
      languageProgress[lang.code] = {
        translated: langTranslations.filter(t => t.status !== 'pending').length,
        reviewed: langTranslations.filter(t => t.status === 'reviewed' || t.status === 'approved').length,
        approved: langTranslations.filter(t => t.status === 'approved').length,
        total: totalKeys
      };
    }

    return {
      totalKeys,
      translatedKeys,
      reviewedKeys,
      approvedKeys,
      languageProgress,
      translationVelocity: { 'en': 10, 'fr': 8, 'ty': 5 },
      qualityScore: { 'en': 95, 'fr': 88, 'ty': 82 },
      costAnalysis: {
        totalCost: 150.50,
        costPerLanguage: { 'fr': 75.25, 'ty': 75.25 },
        costPerProvider: { 'provider1': 100.50, 'provider2': 50.00 }
      }
    };
  }

  // Placeholder implementations for remaining methods
  async getLocalizationRules(languageCode?: string): Promise<LocalizationRule[]> {
    return this.localizationRules.filter(rule => !languageCode || rule.languageCode === languageCode);
  }

  async addLocalizationRule(rule: Omit<LocalizationRule, 'id'>): Promise<LocalizationRule> {
    const newRule: LocalizationRule = { ...rule, id: `rule_${Date.now()}` };
    this.localizationRules.push(newRule);
    return newRule;
  }

  async updateLocalizationRule(id: string, updates: Partial<LocalizationRule>): Promise<LocalizationRule> {
    const index = this.localizationRules.findIndex(rule => rule.id === id);
    if (index === -1) throw new Error('Localization rule not found');
    this.localizationRules[index] = { ...this.localizationRules[index], ...updates };
    return this.localizationRules[index];
  }

  async removeLocalizationRule(id: string): Promise<void> {
    this.localizationRules = this.localizationRules.filter(rule => rule.id !== id);
  }

  async getContentLocalizations(contentId?: string, languageCode?: string): Promise<ContentLocalization[]> {
    return this.contentLocalizations.filter(loc => 
      (!contentId || loc.contentId === contentId) &&
      (!languageCode || loc.languageCode === languageCode)
    );
  }

  async localizeContent(localization: Omit<ContentLocalization, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentLocalization> {
    const newLocalization: ContentLocalization = {
      ...localization,
      id: `loc_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contentLocalizations.push(newLocalization);
    return newLocalization;
  }

  async updateContentLocalization(id: string, updates: Partial<ContentLocalization>): Promise<ContentLocalization> {
    const index = this.contentLocalizations.findIndex(loc => loc.id === id);
    if (index === -1) throw new Error('Content localization not found');
    this.contentLocalizations[index] = { ...this.contentLocalizations[index], ...updates, updatedAt: new Date() };
    return this.contentLocalizations[index];
  }

  async publishContentLocalization(id: string): Promise<ContentLocalization> {
    return this.updateContentLocalization(id, { status: 'published' });
  }

  async removeContentLocalization(id: string): Promise<void> {
    this.contentLocalizations = this.contentLocalizations.filter(loc => loc.id !== id);
  }

  async getTranslationProviders(): Promise<TranslationProvider[]> {
    return this.translationProviders;
  }

  async addTranslationProvider(provider: Omit<TranslationProvider, 'id'>): Promise<TranslationProvider> {
    const newProvider: TranslationProvider = { ...provider, id: `provider_${Date.now()}` };
    this.translationProviders.push(newProvider);
    return newProvider;
  }

  async updateTranslationProvider(id: string, updates: Partial<TranslationProvider>): Promise<TranslationProvider> {
    const index = this.translationProviders.findIndex(provider => provider.id === id);
    if (index === -1) throw new Error('Translation provider not found');
    this.translationProviders[index] = { ...this.translationProviders[index], ...updates };
    return this.translationProviders[index];
  }

  async removeTranslationProvider(id: string): Promise<void> {
    this.translationProviders = this.translationProviders.filter(provider => provider.id !== id);
  }

  async testTranslationProvider(id: string, text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    const provider = this.translationProviders.find(p => p.id === id);
    if (!provider) throw new Error('Provider not found');
    
    // Mock translation
    return `[${provider.name}] Translated: ${text}`;
  }

  async getTranslationJobs(projectId?: string): Promise<TranslationJob[]> {
    return this.translationJobs.filter(job => !projectId || job.projectId === projectId);
  }

  async createTranslationJob(job: Omit<TranslationJob, 'id' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>): Promise<TranslationJob> {
    const newJob: TranslationJob = {
      ...job,
      id: `job_${Date.now()}`,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.translationJobs.push(newJob);
    return newJob;
  }

  async cancelTranslationJob(id: string): Promise<void> {
    const job = this.translationJobs.find(j => j.id === id);
    if (job) job.status = 'failed';
  }

  async retryTranslationJob(id: string): Promise<TranslationJob> {
    const job = this.translationJobs.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    job.status = 'queued';
    job.progress = 0;
    job.updatedAt = new Date();
    return job;
  }

  async getTranslationJobStatus(id: string): Promise<TranslationJob> {
    const job = this.translationJobs.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    return job;
  }

  async getTranslationQualityReport(languageCode: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    return {
      languageCode,
      qualityScore: 85,
      totalTranslations: 150,
      errorRate: 0.05,
      commonErrors: ['Grammar', 'Context', 'Terminology']
    };
  }

  async getTranslationCostAnalysis(dateRange?: { start: Date; end: Date }): Promise<any> {
    return {
      totalCost: 250.75,
      averageCostPerWord: 0.12,
      costByProvider: {
        'Google Translate': 150.50,
        'DeepL': 100.25
      },
      costByLanguage: {
        'fr': 125.25,
        'ty': 125.50
      }
    };
  }

  async exportTranslations(projectId: string, languageCodes: string[], format: 'json' | 'csv' | 'xliff' | 'po'): Promise<Blob> {
    const data = { projectId, languageCodes, format, exported: new Date() };
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  async importTranslations(projectId: string, file: File, format: 'json' | 'csv' | 'xliff' | 'po'): Promise<{ imported: number; errors: string[] }> {
    return {
      imported: 25,
      errors: ['Line 5: Invalid format', 'Line 12: Missing translation key']
    };
  }

  async validateTranslations(languageCode: string): Promise<{ valid: boolean; errors: string[] }> {
    return {
      valid: true,
      errors: []
    };
  }

  async checkTranslationCompleteness(projectId: string): Promise<Record<string, number>> {
    return {
      'fr': 85,
      'ty': 72,
      'ar': 0
    };
  }

  async detectMissingTranslations(languageCode: string): Promise<TranslationKey[]> {
    const existingTranslations = this.translations
      .filter(t => t.languageCode === languageCode)
      .map(t => t.keyId);
    
    return this.translationKeys.filter(key => !existingTranslations.includes(key.id));
  }
}

export const localizationService = new LocalizationService();