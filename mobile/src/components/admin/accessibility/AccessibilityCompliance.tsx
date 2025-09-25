import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Eye, 
  Headphones, 
  Keyboard, 
  Languages, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Download,
  Upload,
  Play,
  Pause,
  Settings,
  RefreshCw,
  FileText,
  Zap,
  Globe
} from 'lucide-react';
import { 
  AccessibilityReport, 
  AccessibilityViolation, 
  CaptionTrack, 
  Transcript,
  ScreenReaderOptimization,
  KeyboardNavigation
} from '../../../types/accessibility';
import { accessibilityService } from '../../../services/AccessibilityService';

interface AccessibilityComplianceProps {
  contentId: string;
  onReportGenerated?: (report: AccessibilityReport) => void;
}

const AccessibilityCompliance: React.FC<AccessibilityComplianceProps> = ({
  contentId,
  onReportGenerated
}) => {
  const [activeTab, setActiveTab] = useState('compliance');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [violations, setViolations] = useState<AccessibilityViolation[]>([]);
  const [captions, setCaptions] = useState<CaptionTrack[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [screenReaderOpt, setScreenReaderOpt] = useState<ScreenReaderOptimization | null>(null);
  const [keyboardNav, setKeyboardNav] = useState<KeyboardNavigation | null>(null);
  const [complianceLevel, setComplianceLevel] = useState<'A' | 'AA' | 'AAA'>('AA');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    loadAccessibilityData();
  }, [contentId]);

  const loadAccessibilityData = async () => {
    setLoading(true);
    try {
      const [reportData, screenReader, keyboard] = await Promise.all([
        accessibilityService.checkCompliance(contentId, complianceLevel),
        accessibilityService.optimizeForScreenReader(contentId),
        accessibilityService.optimizeTabOrder(contentId)
      ]);
      
      setReport(reportData);
      setViolations(reportData.violations);
      setScreenReaderOpt(screenReader);
      setKeyboardNav(keyboard);
      
      if (onReportGenerated) {
        onReportGenerated(reportData);
      }
    } catch (error) {
      console.error('Error loading accessibility data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplianceCheck = async () => {
    setLoading(true);
    try {
      const newReport = await accessibilityService.checkCompliance(contentId, complianceLevel);
      setReport(newReport);
      setViolations(newReport.violations);
      
      if (onReportGenerated) {
        onReportGenerated(newReport);
      }
    } catch (error) {
      console.error('Error checking compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFix = async (violationIds: string[]) => {
    setLoading(true);
    try {
      const success = await accessibilityService.autoFixViolations(contentId, violationIds);
      if (success) {
        await handleComplianceCheck(); // Refresh report
      }
    } catch (error) {
      console.error('Error auto-fixing violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCaptions = async (videoId: string) => {
    setLoading(true);
    try {
      const caption = await accessibilityService.generateCaptions(videoId, selectedLanguage);
      setCaptions(prev => [...prev, caption]);
    } catch (error) {
      console.error('Error generating captions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTranscript = async (audioId: string) => {
    setLoading(true);
    try {
      const transcript = await accessibilityService.createTranscript(audioId, selectedLanguage);
      setTranscripts(prev => [...prev, transcript]);
    } catch (error) {
      console.error('Error creating transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const tabs = [
    { id: 'compliance', label: 'WCAG Compliance', icon: Shield },
    { id: 'screen-reader', label: 'Screen Reader', icon: Eye },
    { id: 'captions', label: 'Captions & Audio', icon: Headphones },
    { id: 'keyboard', label: 'Keyboard Access', icon: Keyboard },
    { id: 'languages', label: 'Languages', icon: Languages }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Accessibility Compliance</h2>
            <p className="text-sm text-gray-600 mt-1">
              Ensure your content meets accessibility standards and best practices
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={complianceLevel}
              onChange={(e) => setComplianceLevel(e.target.value as 'A' | 'AA' | 'AAA')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="A">WCAG A</option>
              <option value="AA">WCAG AA</option>
              <option value="AAA">WCAG AAA</option>
            </select>
            <button
              onClick={handleComplianceCheck}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Check Compliance</span>
            </button>
          </div>
        </div>

        {/* Score Display */}
        {report && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Overall Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(report.score)}`}>
                  {report.score}%
                </span>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Errors</span>
                <span className="text-2xl font-bold text-red-600">{report.summary.errors}</span>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Warnings</span>
                <span className="text-2xl font-bold text-yellow-600">{report.summary.warnings}</span>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Passed</span>
                <span className="text-2xl font-bold text-green-600">{report.summary.passed}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Violations List */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Accessibility Issues</h3>
              {violations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No accessibility issues found!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {violations.map((violation) => (
                    <div key={violation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getSeverityIcon(violation.severity)}
                          <div>
                            <h4 className="font-medium text-gray-900">{violation.message}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Element: <code className="bg-gray-100 px-1 rounded">{violation.element}</code>
                            </p>
                            {violation.suggestion && (
                              <p className="text-sm text-blue-600 mt-2">
                                Suggestion: {violation.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                        {violation.autoFixable && (
                          <button
                            onClick={() => handleAutoFix([violation.id])}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 flex items-center space-x-1"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Auto Fix</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'screen-reader' && screenReaderOpt && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Screen Reader Optimization</h3>
              
              {/* Heading Structure */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Heading Structure</h4>
                <div className="space-y-2">
                  {screenReaderOpt.headingStructure.map((heading, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className="text-sm font-mono bg-white px-2 py-1 rounded">
                        H{heading.level}
                      </span>
                      <span className="text-sm text-gray-700">{heading.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ARIA Labels */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3">ARIA Labels</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(screenReaderOpt.ariaLabels).map(([key, value]) => (
                    <div key={key} className="bg-white p-3 rounded border">
                      <div className="text-sm font-mono text-gray-600">{key}</div>
                      <div className="text-sm text-gray-900 mt-1">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skip Links */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Skip Links</h4>
                <div className="space-y-2">
                  {screenReaderOpt.skipLinks.map((link, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                      <span className="text-sm text-gray-900">{link.text}</span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{link.target}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'captions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Captions &amp; Transcripts</h3>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                </select>
                <button
                  onClick={() => handleGenerateCaptions('video-1')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Generate Captions</span>
                </button>
              </div>
            </div>

            {/* Captions List */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Available Captions</h4>
              {captions.length === 0 ? (
                <p className="text-gray-600 text-sm">No captions available. Generate captions to get started.</p>
              ) : (
                <div className="space-y-3">
                  {captions.map((caption) => (
                    <div key={caption.id} className="bg-white p-3 rounded border flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{caption.label}</div>
                        <div className="text-sm text-gray-600">
                          {caption.autoGenerated ? 'Auto-generated' : 'Manual'} • 
                          Accuracy: {((caption.accuracy || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transcripts */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Transcripts</h4>
                <button
                  onClick={() => handleCreateTranscript('audio-1')}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center space-x-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>Create Transcript</span>
                </button>
              </div>
              {transcripts.length === 0 ? (
                <p className="text-gray-600 text-sm">No transcripts available.</p>
              ) : (
                <div className="space-y-3">
                  {transcripts.map((transcript) => (
                    <div key={transcript.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {transcript.language.toUpperCase()} Transcript
                        </div>
                        <div className="text-sm text-gray-600">
                          {transcript.reviewed ? 'Reviewed' : 'Needs Review'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {transcript.text.substring(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'keyboard' && keyboardNav && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Keyboard Navigation</h3>
            
            {/* Tab Order */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Tab Order</h4>
              <div className="flex flex-wrap gap-2">
                {keyboardNav.tabOrder.map((selector, index) => (
                  <div key={index} className="bg-white px-3 py-2 rounded border flex items-center space-x-2">
                    <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {index + 1}
                    </span>
                    <code className="text-sm text-gray-700">{selector}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Keyboard Shortcuts</h4>
              <div className="space-y-3">
                {keyboardNav.shortcuts.map((shortcut, index) => (
                  <div key={index} className="bg-white p-3 rounded border flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{shortcut.description}</div>
                      <div className="text-sm text-gray-600">{shortcut.action}</div>
                    </div>
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Focus Management */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Focus Management</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm font-medium text-gray-900">Trap Focus</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {keyboardNav.focusManagement.trapFocus ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm font-medium text-gray-900">Restore Focus</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {keyboardNav.focusManagement.restoreFocus ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'languages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Multi-language Support</h3>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Detect Language</span>
              </button>
            </div>

            {/* Language Settings */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Content Languages</h4>
                <div className="space-y-3">
                  {['English', 'French', 'Spanish', 'German', 'Arabic'].map((lang) => (
                    <div key={lang} className="flex items-center justify-between bg-white p-3 rounded border">
                      <span className="text-sm text-gray-900">{lang}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Supported
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Configure
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">RTL Support</h4>
                <div className="space-y-3">
                  {['Arabic', 'Hebrew', 'Persian'].map((lang) => (
                    <div key={lang} className="flex items-center justify-between bg-white p-3 rounded border">
                      <span className="text-sm text-gray-900">{lang}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          RTL Ready
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Translation Tools */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Translation Tools</h4>
              <div className="grid grid-cols-3 gap-4">
                <button className="bg-white p-4 rounded border hover:border-blue-300 text-center">
                  <Languages className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Auto Translate</div>
                  <div className="text-xs text-gray-600 mt-1">AI-powered translation</div>
                </button>
                <button className="bg-white p-4 rounded border hover:border-green-300 text-center">
                  <FileText className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Export for Translation</div>
                  <div className="text-xs text-gray-600 mt-1">XLIFF format</div>
                </button>
                <button className="bg-white p-4 rounded border hover:border-purple-300 text-center">
                  <Upload className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Import Translations</div>
                  <div className="text-xs text-gray-600 mt-1">Bulk import</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Last updated: {report ? new Date(report.timestamp).toLocaleString() : 'Never'}
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Generate Certificate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityCompliance;