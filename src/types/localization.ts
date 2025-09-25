export interface Language {
  code: string; // ISO 639-1 language code
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  enabled: boolean;
  isDefault: boolean;
}

export interface TranslationKey {
  id: string;
  key: string;
  context?: string;
  description?: string;
  maxLength?: number;
  pluralizable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Translation {
  id: string;
  keyId: string;
  languageCode: string;
  value: string;
  pluralForms?: Record<string, string>; // zero, one, two, few, many, other
  status: 'pending' | 'translated' | 'reviewed' | 'approved';
  translatorId?: string;
  reviewerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationProject {
  id: string;
  name: string;
  description?: string;
  sourceLanguage: string;
  targetLanguages: string[];
  status: 'active' | 'completed' | 'archived';
  progress: Record<string, number>; // languageCode -> percentage
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationMemory {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  context?: string;
  domain?: string;
  createdAt: Date;
}

export interface LocalizationRule {
  id: string;
  languageCode: string;
  type: 'date' | 'number' | 'currency' | 'plural' | 'gender';
  rule: string;
  examples: string[];
  enabled: boolean;
}

export interface ContentLocalization {
  id: string;
  contentId: string;
  contentType: 'course' | 'lesson' | 'quiz' | 'resource';
  languageCode: string;
  localizedFields: Record<string, any>;
  status: 'draft' | 'translated' | 'reviewed' | 'published';
  translatorId?: string;
  reviewerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationProvider {
  id: string;
  name: string;
  type: 'google' | 'azure' | 'aws' | 'deepl' | 'custom';
  apiKey?: string;
  endpoint?: string;
  supportedLanguages: string[];
  maxCharacters?: number;
  costPerCharacter?: number;
  enabled: boolean;
  config: Record<string, any>;
}

export interface TranslationJob {
  id: string;
  projectId: string;
  sourceLanguage: string;
  targetLanguage: string;
  contentIds: string[];
  providerId?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedCompletion?: Date;
  cost?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalizationMetrics {
  totalKeys: number;
  translatedKeys: number;
  reviewedKeys: number;
  approvedKeys: number;
  languageProgress: Record<string, {
    translated: number;
    reviewed: number;
    approved: number;
    total: number;
  }>;
  translationVelocity: Record<string, number>; // keys per day
  qualityScore: Record<string, number>;
  costAnalysis: {
    totalCost: number;
    costPerLanguage: Record<string, number>;
    costPerProvider: Record<string, number>;
  };
}

export interface RTLConfiguration {
  languageCode: string;
  textDirection: 'rtl';
  layoutMirror: boolean;
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  textAlign: 'right' | 'left' | 'center';
  customCSS?: string;
}

export interface LocalizationAPI {
  // Language Management
  getLanguages(): Promise<Language[]>;
  addLanguage(language: Omit<Language, 'enabled'>): Promise<Language>;
  updateLanguage(code: string, updates: Partial<Language>): Promise<Language>;
  removeLanguage(code: string): Promise<void>;
  setDefaultLanguage(code: string): Promise<void>;

  // Translation Keys
  getTranslationKeys(projectId?: string): Promise<TranslationKey[]>;
  addTranslationKey(key: Omit<TranslationKey, 'id' | 'createdAt' | 'updatedAt'>): Promise<TranslationKey>;
  updateTranslationKey(id: string, updates: Partial<TranslationKey>): Promise<TranslationKey>;
  removeTranslationKey(id: string): Promise<void>;
  importTranslationKeys(keys: Omit<TranslationKey, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TranslationKey[]>;

  // Translations
  getTranslations(keyId?: string, languageCode?: string): Promise<Translation[]>;
  addTranslation(translation: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Translation>;
  updateTranslation(id: string, updates: Partial<Translation>): Promise<Translation>;
  removeTranslation(id: string): Promise<void>;
  bulkUpdateTranslations(updates: { id: string; updates: Partial<Translation> }[]): Promise<Translation[]>;

  // Translation Projects
  getTranslationProjects(): Promise<TranslationProject[]>;
  createTranslationProject(project: Omit<TranslationProject, 'id' | 'progress' | 'createdAt' | 'updatedAt'>): Promise<TranslationProject>;
  updateTranslationProject(id: string, updates: Partial<TranslationProject>): Promise<TranslationProject>;
  deleteTranslationProject(id: string): Promise<void>;
  calculateProjectProgress(id: string): Promise<Record<string, number>>;

  // Translation Memory
  searchTranslationMemory(sourceText: string, sourceLanguage: string, targetLanguage: string): Promise<TranslationMemory[]>;
  addToTranslationMemory(memory: Omit<TranslationMemory, 'id' | 'createdAt'>): Promise<TranslationMemory>;
  updateTranslationMemory(id: string, updates: Partial<TranslationMemory>): Promise<TranslationMemory>;
  clearTranslationMemory(languagePair?: { source: string; target: string }): Promise<void>;

  // Localization Rules
  getLocalizationRules(languageCode?: string): Promise<LocalizationRule[]>;
  addLocalizationRule(rule: Omit<LocalizationRule, 'id'>): Promise<LocalizationRule>;
  updateLocalizationRule(id: string, updates: Partial<LocalizationRule>): Promise<LocalizationRule>;
  removeLocalizationRule(id: string): Promise<void>;

  // Content Localization
  getContentLocalizations(contentId?: string, languageCode?: string): Promise<ContentLocalization[]>;
  localizeContent(localization: Omit<ContentLocalization, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentLocalization>;
  updateContentLocalization(id: string, updates: Partial<ContentLocalization>): Promise<ContentLocalization>;
  publishContentLocalization(id: string): Promise<ContentLocalization>;
  removeContentLocalization(id: string): Promise<void>;

  // Translation Providers
  getTranslationProviders(): Promise<TranslationProvider[]>;
  addTranslationProvider(provider: Omit<TranslationProvider, 'id'>): Promise<TranslationProvider>;
  updateTranslationProvider(id: string, updates: Partial<TranslationProvider>): Promise<TranslationProvider>;
  removeTranslationProvider(id: string): Promise<void>;
  testTranslationProvider(id: string, text: string, sourceLanguage: string, targetLanguage: string): Promise<string>;

  // Translation Jobs
  getTranslationJobs(projectId?: string): Promise<TranslationJob[]>;
  createTranslationJob(job: Omit<TranslationJob, 'id' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>): Promise<TranslationJob>;
  cancelTranslationJob(id: string): Promise<void>;
  retryTranslationJob(id: string): Promise<TranslationJob>;
  getTranslationJobStatus(id: string): Promise<TranslationJob>;

  // Auto-Translation
  autoTranslate(keyIds: string[], sourceLanguage: string, targetLanguages: string[], providerId: string): Promise<TranslationJob>;
  batchTranslate(projectId: string, targetLanguages: string[], providerId: string): Promise<TranslationJob[]>;

  // Metrics and Analytics
  getLocalizationMetrics(projectId?: string, dateRange?: { start: Date; end: Date }): Promise<LocalizationMetrics>;
  getTranslationQualityReport(languageCode: string, dateRange?: { start: Date; end: Date }): Promise<any>;
  getTranslationCostAnalysis(dateRange?: { start: Date; end: Date }): Promise<any>;

  // RTL Support
  getRTLConfiguration(languageCode: string): Promise<RTLConfiguration | null>;
  setRTLConfiguration(config: RTLConfiguration): Promise<RTLConfiguration>;
  generateRTLCSS(languageCode: string): Promise<string>;

  // Import/Export
  exportTranslations(projectId: string, languageCodes: string[], format: 'json' | 'csv' | 'xliff' | 'po'): Promise<Blob>;
  importTranslations(projectId: string, file: File, format: 'json' | 'csv' | 'xliff' | 'po'): Promise<{ imported: number; errors: string[] }>;

  // Validation
  validateTranslations(languageCode: string): Promise<{ valid: boolean; errors: string[] }>;
  checkTranslationCompleteness(projectId: string): Promise<Record<string, number>>;
  detectMissingTranslations(languageCode: string): Promise<TranslationKey[]>;
}