'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Zap, Upload, Download, Calendar, Clock, CheckCircle, 
  AlertCircle, RefreshCw, Play, Pause, Stop, Settings,
  FileText, Image, Video, Mic, Languages, Copy,
  Trash2, Edit3, Eye, Filter, Search, MoreHorizontal,
  Archive, Publish, Schedule, Target, Users, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface BatchOperationsSystemProps {
  className?: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'quiz' | 'exercise' | 'assessment' | 'media';
  status: 'draft' | 'review' | 'published' | 'archived';
  language: 'fr' | 'ty' | 'en';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
  author: string;
  tags: string[];
  size: number; // in KB
  duration?: number; // in minutes
  completionRate?: number;
  rating?: number;
}

interface BatchOperation {
  id: string;
  name: string;
  type: 'translate' | 'publish' | 'archive' | 'duplicate' | 'export' | 'optimize' | 'schedule';
  description: string;
  icon: React.ReactNode;
  requiresConfig: boolean;
  estimatedTime: string;
}

interface ScheduledTask {
  id: string;
  name: string;
  operation: string;
  targetItems: string[];
  scheduledFor: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: string;
  createdBy: string;
}

interface BatchConfig {
  operation: string;
  targetLanguage?: string;
  publishDate?: Date;
  tags?: string[];
  category?: string;
  notification?: boolean;
  backup?: boolean;
}

const BatchOperationsSystem = React.memo(function BatchOperationsSystem({ className }: BatchOperationsSystemProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('operations');
  
  // Content Management State
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Batch Operations State
  const [selectedOperation, setSelectedOperation] = useState<BatchOperation | null>(null);
  const [batchConfig, setBatchConfig] = useState<BatchConfig>({
    operation: '',
    notification: true,
    backup: true
  });
  const [operationProgress, setOperationProgress] = useState(0);
  const [isOperationRunning, setIsOperationRunning] = useState(false);
  
  // Scheduling State
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');

  // Available batch operations
  const batchOperations: BatchOperation[] = [
    {
      id: 'translate',
      name: 'Bulk Translation',
      type: 'translate',
      description: 'Translate content to multiple languages using AI',
      icon: <Languages className="h-4 w-4" />,
      requiresConfig: true,
      estimatedTime: '2-5 min per item'
    },
    {
      id: 'publish',
      name: 'Bulk Publish',
      type: 'publish',
      description: 'Publish multiple content items at once',
      icon: <Publish className="h-4 w-4" />,
      requiresConfig: false,
      estimatedTime: '30 sec per item'
    },
    {
      id: 'archive',
      name: 'Bulk Archive',
      type: 'archive',
      description: 'Archive outdated or unused content',
      icon: <Archive className="h-4 w-4" />,
      requiresConfig: false,
      estimatedTime: '10 sec per item'
    },
    {
      id: 'duplicate',
      name: 'Bulk Duplicate',
      type: 'duplicate',
      description: 'Create copies of content for different audiences',
      icon: <Copy className="h-4 w-4" />,
      requiresConfig: true,
      estimatedTime: '1 min per item'
    },
    {
      id: 'export',
      name: 'Bulk Export',
      type: 'export',
      description: 'Export content in various formats (PDF, SCORM, etc.)',
      icon: <Download className="h-4 w-4" />,
      requiresConfig: true,
      estimatedTime: '1-3 min per item'
    },
    {
      id: 'optimize',
      name: 'AI Optimization',
      type: 'optimize',
      description: 'Optimize content using AI suggestions',
      icon: <Target className="h-4 w-4" />,
      requiresConfig: false,
      estimatedTime: '3-7 min per item'
    },
    {
      id: 'schedule',
      name: 'Schedule Publishing',
      type: 'schedule',
      description: 'Schedule content for future publication',
      icon: <Schedule className="h-4 w-4" />,
      requiresConfig: true,
      estimatedTime: 'Instant'
    }
  ];

  // Mock content data
  useEffect(() => {
    const mockContent: ContentItem[] = [
      {
        id: '1',
        title: 'Basic Tahitian Greetings',
        type: 'lesson',
        status: 'published',
        language: 'ty',
        difficulty: 'beginner',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        author: 'Content Creator',
        tags: ['greetings', 'basics', 'conversation'],
        size: 245,
        duration: 15,
        completionRate: 89,
        rating: 4.7
      },
      {
        id: '2',
        title: 'Family Vocabulary Quiz',
        type: 'quiz',
        status: 'draft',
        language: 'ty',
        difficulty: 'beginner',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
        author: 'Content Creator',
        tags: ['family', 'vocabulary', 'quiz'],
        size: 156,
        duration: 10,
        completionRate: 0,
        rating: 0
      },
      {
        id: '3',
        title: 'Tahitian Culture Introduction',
        type: 'lesson',
        status: 'review',
        language: 'ty',
        difficulty: 'intermediate',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-22'),
        author: 'Content Creator',
        tags: ['culture', 'history', 'traditions'],
        size: 387,
        duration: 25,
        completionRate: 0,
        rating: 0
      },
      {
        id: '4',
        title: 'Pronunciation Practice Audio',
        type: 'media',
        status: 'published',
        language: 'ty',
        difficulty: 'beginner',
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
        author: 'Content Creator',
        tags: ['pronunciation', 'audio', 'practice'],
        size: 1024,
        duration: 8,
        completionRate: 76,
        rating: 4.3
      },
      {
        id: '5',
        title: 'Advanced Grammar Exercise',
        type: 'exercise',
        status: 'draft',
        language: 'ty',
        difficulty: 'advanced',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
        author: 'Content Creator',
        tags: ['grammar', 'advanced', 'exercise'],
        size: 298,
        duration: 20,
        completionRate: 0,
        rating: 0
      }
    ];
    setContentItems(mockContent);

    // Mock scheduled tasks
    const mockTasks: ScheduledTask[] = [
      {
        id: '1',
        name: 'Publish Weekend Lessons',
        operation: 'publish',
        targetItems: ['2', '3'],
        scheduledFor: new Date('2024-02-03T09:00:00'),
        status: 'pending',
        progress: 0,
        createdBy: 'Content Creator'
      },
      {
        id: '2',
        name: 'Translate to French',
        operation: 'translate',
        targetItems: ['1', '4'],
        scheduledFor: new Date('2024-02-01T14:30:00'),
        status: 'completed',
        progress: 100,
        result: 'Successfully translated 2 items to French',
        createdBy: 'Content Creator'
      }
    ];
    setScheduledTasks(mockTasks);
  }, []);

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedItems.length === filteredContent.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredContent.map(item => item.id));
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const executeBatchOperation = async () => {
    if (!selectedOperation || selectedItems.length === 0) {
      toast.error('Please select an operation and items to process');
      return;
    }

    setIsOperationRunning(true);
    setOperationProgress(0);
    setLoading(true);

    try {
      // Simulate batch operation progress
      const totalItems = selectedItems.length;
      for (let i = 0; i <= totalItems; i++) {
        setOperationProgress((i / totalItems) * 100);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Update content status based on operation
      if (selectedOperation.type === 'publish') {
        setContentItems(prev => prev.map(item => 
          selectedItems.includes(item.id) 
            ? { ...item, status: 'published' as const, updatedAt: new Date() }
            : item
        ));
      } else if (selectedOperation.type === 'archive') {
        setContentItems(prev => prev.map(item => 
          selectedItems.includes(item.id) 
            ? { ...item, status: 'archived' as const, updatedAt: new Date() }
            : item
        ));
      }

      toast.success(`${selectedOperation.name} completed successfully for ${selectedItems.length} items!`);
      setSelectedItems([]);
      setSelectedOperation(null);
    } catch (error) {
      console.error('Batch operation error:', error);
      toast.error('Batch operation failed. Please try again.');
    } finally {
      setIsOperationRunning(false);
      setOperationProgress(0);
      setLoading(false);
    }
  };

  const scheduleOperation = async () => {
    if (!selectedOperation || selectedItems.length === 0 || !scheduleDate || !scheduleTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`);
    
    const newTask: ScheduledTask = {
      id: Date.now().toString(),
      name: `${selectedOperation.name} - ${selectedItems.length} items`,
      operation: selectedOperation.type,
      targetItems: [...selectedItems],
      scheduledFor,
      status: 'pending',
      progress: 0,
      createdBy: 'Content Creator'
    };

    setScheduledTasks(prev => [newTask, ...prev]);
    toast.success('Operation scheduled successfully!');
    
    // Reset form
    setSelectedItems([]);
    setSelectedOperation(null);
    setScheduleDate('');
    setScheduleTime('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-50';
      case 'review': return 'text-yellow-600 bg-yellow-50';
      case 'draft': return 'text-gray-600 bg-gray-50';
      case 'archived': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <FileText className="h-4 w-4" />;
      case 'quiz': return <CheckCircle className="h-4 w-4" />;
      case 'exercise': return <Target className="h-4 w-4" />;
      case 'assessment': return <BarChart3 className="h-4 w-4" />;
      case 'media': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-purple-600" />
            Batch Operations System
          </h1>
          <p className="text-gray-600 mt-2">
            Efficiently manage multiple content items with powerful batch operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Content
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Operation Progress */}
      {isOperationRunning && (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            <div className="flex justify-between items-center">
              <span>
                <strong>Running:</strong> {selectedOperation?.name} on {selectedItems.length} items
              </span>
              <span>{Math.round(operationProgress)}%</span>
            </div>
            <Progress value={operationProgress} className="mt-2" />
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content Manager
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduler
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Available Operations
                </CardTitle>
                <CardDescription>
                  Select an operation to perform on your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {batchOperations.map((operation) => (
                    <Card 
                      key={operation.id}
                      className={`cursor-pointer transition-all ${
                        selectedOperation?.id === operation.id 
                          ? 'ring-2 ring-purple-500 bg-purple-50' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedOperation(operation)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                            {operation.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{operation.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{operation.description}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>Est. time: {operation.estimatedTime}</span>
                              {operation.requiresConfig && (
                                <Badge variant="outline" className="text-xs">
                                  Requires Config
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Operation Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Operation Configuration
                </CardTitle>
                <CardDescription>
                  Configure settings for the selected operation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedOperation ? (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an operation to configure</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800">{selectedOperation.name}</h4>
                      <p className="text-sm text-purple-600">{selectedOperation.description}</p>
                    </div>

                    {selectedOperation.type === 'translate' && (
                      <div className="space-y-2">
                        <Label>Target Language</Label>
                        <Select
                          value={batchConfig.targetLanguage || ''}
                          onValueChange={(value) => setBatchConfig(prev => ({ ...prev, targetLanguage: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ty">Tahitian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedOperation.type === 'duplicate' && (
                      <div className="space-y-2">
                        <Label>Category for Duplicates</Label>
                        <Input
                          placeholder="e.g., Advanced Version"
                          value={batchConfig.category || ''}
                          onChange={(e) => setBatchConfig(prev => ({ ...prev, category: e.target.value }))}
                        />
                      </div>
                    )}

                    {selectedOperation.type === 'schedule' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Publish Date</Label>
                          <Input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Publish Time</Label>
                          <Input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="notification"
                          checked={batchConfig.notification}
                          onCheckedChange={(checked) => setBatchConfig(prev => ({ ...prev, notification: !!checked }))}
                        />
                        <Label htmlFor="notification" className="text-sm">
                          Send notification when complete
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="backup"
                          checked={batchConfig.backup}
                          onCheckedChange={(checked) => setBatchConfig(prev => ({ ...prev, backup: !!checked }))}
                        />
                        <Label htmlFor="backup" className="text-sm">
                          Create backup before operation
                        </Label>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Selected Items:</span>
                        <span className="font-medium">{selectedItems.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Estimated Time:</span>
                        <span className="font-medium">{selectedOperation.estimatedTime}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {selectedOperation.type === 'schedule' ? (
                        <Button 
                          onClick={scheduleOperation}
                          disabled={selectedItems.length === 0 || !scheduleDate || !scheduleTime}
                          className="flex-1"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Operation
                        </Button>
                      ) : (
                        <Button 
                          onClick={executeBatchOperation}
                          disabled={loading || selectedItems.length === 0}
                          className="flex-1"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Execute Now
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Manager Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Manager
              </CardTitle>
              <CardDescription>
                Select and manage content items for batch operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lesson">Lessons</SelectItem>
                    <SelectItem value="quiz">Quizzes</SelectItem>
                    <SelectItem value="exercise">Exercises</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selection Controls */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {selectedItems.length === filteredContent.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {selectedItems.length} of {filteredContent.length} items selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export List
                  </Button>
                </div>
              </div>

              {/* Content List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredContent.map((item) => (
                  <Card 
                    key={item.id}
                    className={`cursor-pointer transition-all ${
                      selectedItems.includes(item.id) 
                        ? 'ring-2 ring-purple-500 bg-purple-50' 
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => handleSelectItem(item.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                        />
                        <div className="p-2 rounded-lg bg-gray-100">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <div className="flex gap-1">
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                              <Badge variant="outline">
                                {item.difficulty}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <div className="flex gap-4">
                              <span>{item.type}</span>
                              <span>{item.size} KB</span>
                              {item.duration && <span>{item.duration} min</span>}
                              {item.completionRate && <span>{item.completionRate}% completion</span>}
                            </div>
                            <div className="flex gap-1">
                              {item.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduler Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Tasks
              </CardTitle>
              <CardDescription>
                View and manage scheduled batch operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No scheduled tasks</h3>
                  <p>Schedule operations from the Operations tab</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledTasks.map((task) => (
                    <Card key={task.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{task.name}</h4>
                            <p className="text-sm text-gray-600">
                              {task.targetItems.length} items • {task.operation}
                            </p>
                          </div>
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Scheduled for:</span>
                            <br />
                            {task.scheduledFor.toLocaleDateString()} at {task.scheduledFor.toLocaleTimeString()}
                          </div>
                          <div>
                            <span className="font-medium">Created by:</span>
                            <br />
                            {task.createdBy}
                          </div>
                        </div>

                        {task.status === 'running' && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} />
                          </div>
                        )}

                        {task.result && (
                          <div className="bg-green-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-green-800">{task.result}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {task.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline">
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline">
                                <Play className="h-3 w-3 mr-1" />
                                Run Now
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          {task.status === 'pending' && (
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operation History
              </CardTitle>
              <CardDescription>
                View completed batch operations and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No operation history</h3>
                <p>Completed operations will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default BatchOperationsSystem;