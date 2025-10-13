import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Play, 
  Pause, 
  Square, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  Activity
} from 'lucide-react';
import { ABTestingService, ABTestConfig, ABTestResult, ABTestAnalysis } from '../services/ABTestingService';
import { toast } from 'sonner';

interface TestMetrics {
  testId: string;
  name: string;
  status: string;
  participants: number;
  conversionRate: number;
  confidence: number;
  uplift: number;
  startDate: string;
  endDate?: string;
}

const ABTestDashboard: React.FC = () => {
  const [service] = useState(() => new ABTestingService());
  const [tests, setTests] = useState<ABTestConfig[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<ABTestResult[]>([]);
  const [testAnalysis, setTestAnalysis] = useState<ABTestAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      loadTestResults(selectedTest);
    }
  }, [selectedTest]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const allTests = service.getAllTests();
      setTests(allTests);
      
      if (allTests.length > 0 && !selectedTest) {
        setSelectedTest(allTests[0].id);
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
      toast.error('Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  };

  const loadTestResults = async (testId: string) => {
    try {
      const results = await service.calculateResults(testId);
      const analysis = await service.analyzeTest(testId);
      
      setTestResults(results);
      setTestAnalysis(analysis);
    } catch (error) {
      console.error('Failed to load test results:', error);
      toast.error('Failed to load test results');
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      await service.startTest(testId);
      await loadTests();
      toast.success('Test started successfully');
    } catch (error) {
      console.error('Failed to start test:', error);
      toast.error('Failed to start test');
    }
  };

  const handleStopTest = async (testId: string) => {
    try {
      await service.stopTest(testId);
      await loadTests();
      toast.success('Test stopped successfully');
    } catch (error) {
      console.error('Failed to stop test:', error);
      toast.error('Failed to stop test');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      await service.deleteTest(testId);
      await loadTests();
      if (selectedTest === testId) {
        setSelectedTest(tests.length > 1 ? tests.find(t => t.id !== testId)?.id || null : null);
      }
      toast.success('Test deleted successfully');
    } catch (error) {
      console.error('Failed to delete test:', error);
      toast.error('Failed to delete test');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'draft':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <Square className="h-4 w-4" />;
      case 'draft':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const exportResults = () => {
    if (!testResults || !selectedTest) return;

    const test = tests.find(t => t.id === selectedTest);
    const data = {
      test: test,
      results: testResults,
      analysis: testAnalysis,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ab-test-results-${selectedTest}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Results exported successfully');
  };

  const selectedTestData = tests.find(t => t.id === selectedTest);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">A/B Testing Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and analyze your experiments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportResults} disabled={!selectedTest}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Running Tests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tests.filter(t => t.status === 'running').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {testResults.reduce((sum, r) => sum + r.participants, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {testResults.length > 0 
                    ? `${(testResults.reduce((sum, r) => sum + r.conversionRate, 0) / testResults.length * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Tests</CardTitle>
            <CardDescription>Select a test to view details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTest === test.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTest(test.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{test.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(test.status)} text-white`}>
                        {getStatusIcon(test.status)}
                        <span className="ml-1 text-xs">{test.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{test.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{test.variants.length} variants</span>
                    <span>{formatDate(test.startDate)}</span>
                  </div>
                  
                  {test.status === 'draft' && (
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTest(test.id);
                        }}
                        className="text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTest(test.id);
                        }}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {test.status === 'running' && (
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStopTest(test.id);
                        }}
                        className="text-xs"
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTestData ? (
            <>
              {/* Test Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedTestData.name}</CardTitle>
                      <CardDescription>{selectedTestData.description}</CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(selectedTestData.status)} text-white`}>
                      {getStatusIcon(selectedTestData.status)}
                      <span className="ml-1">{selectedTestData.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p className="font-medium">{formatDate(selectedTestData.startDate)}</p>
                    </div>
                    {selectedTestData.endDate && (
                      <div>
                        <span className="text-gray-600">End Date:</span>
                        <p className="font-medium">{formatDate(selectedTestData.endDate)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Traffic Allocation:</span>
                      <p className="font-medium">{selectedTestData.trafficAllocation}%</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Variants:</span>
                      <p className="font-medium">{selectedTestData.variants.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Status */}
              {testAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Analysis Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        {testAnalysis.status === 'winner_found' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {testAnalysis.status === 'insufficient_data' && (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        )}
                        {testAnalysis.status === 'no_winner' && (
                          <Clock className="h-5 w-5 text-gray-600" />
                        )}
                        <span className="font-medium capitalize">
                          {testAnalysis.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Statistical Power: {(testAnalysis.statisticalPower * 100).toFixed(1)}%
                      </div>
                    </div>

                    {testAnalysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations:</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {testAnalysis.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Results */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="variants">Variants</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {testResults.length > 0 && (
                    <>
                      {/* Conversion Rate Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Conversion Rate by Variant</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={testResults}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="variantName" />
                              <YAxis tickFormatter={(value) => `${(value * 100).toFixed(1)}%`} />
                              <Tooltip 
                                formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Conversion Rate']}
                              />
                              <Bar dataKey="conversionRate" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Participants Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Participants by Variant</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={testResults}
                                dataKey="participants"
                                nameKey="variantName"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                label={({ name, value }) => `${name}: ${value}`}
                              >
                                {testResults.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="variants" className="space-y-4">
                  {testResults.map((result) => (
                    <Card key={result.variantId}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{result.variantName}</CardTitle>
                          <div className="flex items-center gap-2">
                            {result.uplift > 0 && (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            )}
                            {result.uplift < 0 && (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              result.uplift > 0 ? 'text-green-600' : 
                              result.uplift < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {result.uplift > 0 ? '+' : ''}{result.uplift.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Participants:</span>
                            <p className="font-medium text-lg">{result.participants.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Conversions:</span>
                            <p className="font-medium text-lg">{result.conversions.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Conversion Rate:</span>
                            <p className="font-medium text-lg">{(result.conversionRate * 100).toFixed(2)}%</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Confidence:</span>
                            <p className={`font-medium text-lg ${getConfidenceColor(result.confidence)}`}>
                              {(result.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  {testResults.map((result) => (
                    <Card key={result.variantId}>
                      <CardHeader>
                        <CardTitle>{result.variantName} - Custom Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {Object.keys(result.metrics).length > 0 ? (
                          <div className="space-y-4">
                            {Object.entries(result.metrics).map(([metricName, metric]) => (
                              <div key={metricName} className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">{metric.name}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Value:</span>
                                    <p className="font-medium">{metric.value.toFixed(3)}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Sample Size:</span>
                                    <p className="font-medium">{metric.sampleSize}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Variance:</span>
                                    <p className="font-medium">{metric.variance.toFixed(3)}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">95% CI:</span>
                                    <p className="font-medium">
                                      [{metric.confidenceInterval[0].toFixed(3)}, {metric.confidenceInterval[1].toFixed(3)}]
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No custom metrics recorded</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Selected</h3>
                <p className="text-gray-600">Select a test from the list to view its details and results.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ABTestDashboard;