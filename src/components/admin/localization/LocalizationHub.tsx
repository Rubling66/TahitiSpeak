import React, { useState, useEffect } from 'react';
import {
  Globe,
  Languages,
  FileText,
  Settings,
  Download,
  Upload,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Clock,
  DollarSign,
  Target,
  Zap,
  RefreshCw,
  Save,
  X
} from 'lucide-react';
import { localizationService } from '../../../services/LocalizationService';
import {
  Language,
  TranslationKey,
  Translation,
  TranslationProject,
  TranslationProvider,
  TranslationJob,
  LocalizationMetrics,
  RTLConfiguration
} from '../../../types/localization';

const LocalizationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('languages');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Data states
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translationKeys, setTranslationKeys] = useState<TranslationKey[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [providers, setProviders] = useState<TranslationProvider[]>([]);
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [metrics, setMetrics] = useState<LocalizationMetrics | null>(null);
  const [rtlConfigs, setRtlConfigs] = useState<RTLConfiguration[]>([]);
  
  // Modal states
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'languages':
          const langs = await localizationService.getLanguages();
          setLanguages(langs);
          break;
        case 'keys':
          const keys = await localizationService.getTranslationKeys();
          setTranslationKeys(keys);
          break;
        case 'translations':
          const trans = await localizationService.getTranslations();
          setTranslations(trans);
          break;
        case 'projects':
          const projs = await localizationService.getTranslationProjects();
          setProjects(projs);
          break;
        case 'providers':
          const provs = await localizationService.getTranslationProviders();
          setProviders(provs);
          break;
        case 'jobs':
          const jobList = await localizationService.getTranslationJobs();
          setJobs(jobList);
          break;
        case 'analytics':
          const metricsData = await localizationService.getLocalizationMetrics();
          setMetrics(metricsData);
          break;
        case 'rtl':
          const allLangs = await localizationService.getLanguages();
          const rtlLangs = allLangs.filter(lang => lang.direction === 'rtl');
          const configs: RTLConfiguration[] = [];
          for (const lang of rtlLangs) {
            const config = await localizationService.getRTLConfiguration(lang.code);
            if (config) configs.push(config);
          }
          setRtlConfigs(configs);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLanguage = async (languageData: any) => {
    try {
      await localizationService.addLanguage(languageData);
      loadData();
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error adding language:', error);
    }
  };

  const handleAddTranslationKey = async (keyData: any) => {
    try {
      await localizationService.addTranslationKey(keyData);
      loadData();
      setShowKeyModal(false);
    } catch (error) {
      console.error('Error adding translation key:', error);
    }
  };

  const handleAutoTranslate = async (keyIds: string[], targetLanguages: string[]) => {
    try {
      const provider = providers.find(p => p.enabled);
      if (!provider) {
        alert('No translation provider available');
        return;
      }
      
      await localizationService.autoTranslate(keyIds, 'en', targetLanguages, provider.id);
      loadData();
    } catch (error) {
      console.error('Error auto-translating:', error);
    }
  };

  const handleExportTranslations = async (projectId: string, languageCodes: string[]) => {
    try {
      const blob = await localizationService.exportTranslations(projectId, languageCodes, 'json');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations_${projectId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting translations:', error);
    }
  };

  const filteredData = () => {
    let data: any[] = [];
    switch (activeTab) {
      case 'languages':
        data = languages;
        break;
      case 'keys':
        data = translationKeys;
        break;
      case 'translations':
        data = translations;
        break;
      case 'projects':
        data = projects;
        break;
      case 'providers':
        data = providers;
        break;
      case 'jobs':
        data = jobs;
        break;
      default:
        return [];
    }

    if (searchTerm) {
      data = data.filter((item: any) => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (filterStatus !== 'all') {
      data = data.filter((item: any) => item.status === filterStatus || item.enabled === (filterStatus === 'enabled'));
    }

    return data;
  };

  const renderLanguagesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Language Management</h3>
        <button
          onClick={() => setShowLanguageModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Language
        </button>
      </div>

      <div className="grid gap-4">
        {filteredData().map((language: Language) => (
          <div key={language.code} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium">{language.name}</h4>
                  <span className="text-sm text-gray-500">({language.code})</span>
                  {language.isDefault && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Default
                    </span>
                  )}
                  {language.direction === 'rtl' && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                      RTL
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Native: {language.nativeName}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    language.enabled ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="text-sm text-gray-600">
                    {language.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingItem(language);
                    setShowLanguageModal(true);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTranslationKeysTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Translation Keys</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowKeyModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Key
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredData().map((key: TranslationKey) => (
          <div key={key.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium font-mono">{key.key}</h4>
                  {key.pluralizable && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      Plural
                    </span>
                  )}
                </div>
                {key.description && (
                  <p className="text-sm text-gray-600 mb-2">{key.description}</p>
                )}
                {key.context && (
                  <p className="text-xs text-gray-500 mb-2">Context: {key.context}</p>
                )}
                {key.maxLength && (
                  <p className="text-xs text-gray-500">Max length: {key.maxLength}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAutoTranslate([key.id], ['fr', 'ty'])}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                  title="Auto-translate"
                >
                  <Zap className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTranslationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Translations</h3>
        <button
          onClick={() => setShowTranslationModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Translation
        </button>
      </div>

      <div className="grid gap-4">
        {filteredData().map((translation: Translation) => {
          const key = translationKeys.find(k => k.id === translation.keyId);
          return (
            <div key={translation.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Languages className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium">{key?.key || 'Unknown Key'}</h4>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                      {translation.languageCode.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      translation.status === 'approved' ? 'bg-green-100 text-green-800' :
                      translation.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      translation.status === 'translated' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {translation.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mb-2 font-medium">
                    {translation.value}
                  </p>
                  {translation.pluralForms && (
                    <div className="text-xs text-gray-600">
                      <strong>Plural forms:</strong>
                      {Object.entries(translation.pluralForms).map(([form, value]) => (
                        <span key={form} className="ml-2">
                          {form}: "{value}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProvidersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Translation Providers</h3>
        <button
          onClick={() => setShowProviderModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>

      <div className="grid gap-4">
        {filteredData().map((provider: TranslationProvider) => (
          <div key={provider.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium">{provider.name}</h4>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                    {provider.type}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    provider.enabled ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Languages:</strong> {provider.supportedLanguages.length}
                  </div>
                  <div>
                    <strong>Max chars:</strong> {provider.maxCharacters?.toLocaleString() || 'Unlimited'}
                  </div>
                  <div>
                    <strong>Cost/char:</strong> ${provider.costPerCharacter || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => localizationService.testTranslationProvider(
                    provider.id, 
                    'Hello world', 
                    'en', 
                    'fr'
                  )}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                  title="Test provider"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Translation Jobs</h3>
        <button
          onClick={loadData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {filteredData().map((job: TranslationJob) => (
          <div key={job.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium">Job #{job.id.slice(-8)}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div>
                    <strong>From:</strong> {job.sourceLanguage.toUpperCase()}
                  </div>
                  <div>
                    <strong>To:</strong> {job.targetLanguage.toUpperCase()}
                  </div>
                  <div>
                    <strong>Content items:</strong> {job.contentIds.length}
                  </div>
                  <div>
                    <strong>Cost:</strong> ${job.cost || 'Calculating...'}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{job.progress}% complete</span>
                  {job.estimatedCompletion && (
                    <span>ETA: {job.estimatedCompletion.toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {job.status === 'processing' && (
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded">
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                {job.status === 'failed' && (
                  <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Localization Analytics</h3>
      
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Keys</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalKeys}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Translated</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.translatedKeys}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.approvedKeys}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-purple-600">${metrics.costAnalysis.totalCost}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold mb-4">Language Progress</h4>
              <div className="space-y-4">
                {Object.entries(metrics.languageProgress).map(([langCode, progress]) => (
                  <div key={langCode}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{langCode.toUpperCase()}</span>
                      <span>{Math.round((progress.approved / progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(progress.approved / progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold mb-4">Translation Velocity</h4>
              <div className="space-y-3">
                {Object.entries(metrics.translationVelocity).map(([langCode, velocity]) => (
                  <div key={langCode} className="flex justify-between items-center">
                    <span className="font-medium">{langCode.toUpperCase()}</span>
                    <span className="text-sm text-gray-600">{velocity} keys/day</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderRTLTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">RTL Configuration</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add RTL Config
        </button>
      </div>

      <div className="grid gap-4">
        {rtlConfigs.map((config) => (
          <div key={config.languageCode} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium">{config.languageCode.toUpperCase()}</h4>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    RTL
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div><strong>Font:</strong> {config.fontFamily || 'Default'}</div>
                  <div><strong>Size:</strong> {config.fontSize || 'Default'}</div>
                  <div><strong>Align:</strong> {config.textAlign}</div>
                  <div><strong>Mirror:</strong> {config.layoutMirror ? 'Yes' : 'No'}</div>
                </div>
                {config.customCSS && (
                  <div className="mt-2">
                    <strong className="text-xs text-gray-500">Custom CSS:</strong>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {config.customCSS.slice(0, 100)}...
                    </pre>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'languages', label: 'Languages', icon: Globe },
    { id: 'keys', label: 'Translation Keys', icon: FileText },
    { id: 'translations', label: 'Translations', icon: Languages },
    { id: 'projects', label: 'Projects', icon: Target },
    { id: 'providers', label: 'Providers', icon: Settings },
    { id: 'jobs', label: 'Jobs', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'rtl', label: 'RTL Support', icon: Globe }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Localization Hub</h1>
        <p className="text-gray-600">
          Manage translations, languages, and localization workflows
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Filter */}
      {!['analytics', 'rtl'].includes(activeTab) && (
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <div>
          {activeTab === 'languages' && renderLanguagesTab()}
          {activeTab === 'keys' && renderTranslationKeysTab()}
          {activeTab === 'translations' && renderTranslationsTab()}
          {activeTab === 'projects' && renderProvidersTab()}
          {activeTab === 'providers' && renderProvidersTab()}
          {activeTab === 'jobs' && renderJobsTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'rtl' && renderRTLTab()}
        </div>
      )}
    </div>
  );
};

export default LocalizationHub;