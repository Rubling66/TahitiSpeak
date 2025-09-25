import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, 
  FileText, 
  Image, 
  Video, 
  Mic, 
  Settings, 
  Play, 
  Pause, 
  Download,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';

interface AIContent {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video';
  title: string;
  description: string;
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  prompt: string;
  result?: string;
  metadata?: Record<string, any>;
}

interface AIModel {
  id: string;
  name: string;
  type: 'text' | 'image' | 'audio' | 'video';
  description: string;
  isAvailable: boolean;
  cost: number;
}

const AIContentHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [contents, setContents] = useState<AIContent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  const models: AIModel[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      type: 'text',
      description: 'Advanced language model for text generation',
      isAvailable: true,
      cost: 0.03
    },
    {
      id: 'dall-e-3',
      name: 'DALL-E 3',
      type: 'image',
      description: 'High-quality image generation',
      isAvailable: true,
      cost: 0.04
    },
    {
      id: 'whisper',
      name: 'Whisper',
      type: 'audio',
      description: 'Speech recognition and audio processing',
      isAvailable: true,
      cost: 0.006
    },
    {
      id: 'runway-gen2',
      name: 'Runway Gen-2',
      type: 'video',
      description: 'AI video generation and editing',
      isAvailable: false,
      cost: 0.12
    }
  ];

  const mockContents: AIContent[] = [
    {
      id: '1',
      type: 'text',
      title: 'Tahitian Lesson Introduction',
      description: 'Generated introduction for beginner Tahitian lesson',
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000),
      prompt: 'Create an engaging introduction for a beginner Tahitian language lesson',
      result: 'Welcome to your first Tahitian language lesson! Tahitian, or Reo Tahiti, is a beautiful Polynesian language...'
    },
    {
      id: '2',
      type: 'image',
      title: 'Cultural Scene Illustration',
      description: 'Traditional Tahitian cultural scene for lesson materials',
      status: 'completed',
      createdAt: new Date(Date.now() - 7200000),
      prompt: 'Traditional Tahitian village scene with people in traditional dress',
      result: 'https://example.com/generated-image.jpg'
    },
    {
      id: '3',
      type: 'audio',
      title: 'Pronunciation Guide',
      description: 'Audio pronunciation for common Tahitian phrases',
      status: 'generating',
      createdAt: new Date(Date.now() - 1800000),
      prompt: 'Generate clear pronunciation audio for basic Tahitian greetings'
    }
  ];

  useEffect(() => {
    setContents(mockContents);
    setSelectedModel(models[0]);
  }, []);

  const generateContent = async () => {
    if (!prompt.trim() || !selectedModel) return;

    setIsGenerating(true);
    
    const newContent: AIContent = {
      id: Date.now().toString(),
      type: selectedModel.type,
      title: `Generated ${selectedModel.type} content`,
      description: prompt.substring(0, 100) + '...',
      status: 'generating',
      createdAt: new Date(),
      prompt
    };

    setContents(prev => [newContent, ...prev]);

    // Simulate generation process
    setTimeout(() => {
      setContents(prev => 
        prev.map(content => 
          content.id === newContent.id 
            ? { ...content, status: 'completed' as const, result: 'Generated content result...' }
            : content
        )
      );
      setIsGenerating(false);
      setPrompt('');
    }, 3000);
  };

  const getContentIcon = (type: AIContent['type']) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'audio':
        return <Mic className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: AIContent['status']) => {
    switch (status) {
      case 'generating':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <Clock className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: AIContent['status']) => {
    switch (status) {
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            AI Content Hub
          </h1>
          <p className="text-gray-600 mt-2">
            Generate and manage AI-powered content for your Tahitian language platform
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="library">Content Library</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Content</CardTitle>
              <CardDescription>
                Use AI models to create educational content for your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select AI Model</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedModel?.id === model.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!model.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => model.isAvailable && setSelectedModel(model)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getContentIcon(model.type)}
                        <span className="font-medium text-sm">{model.name}</span>
                        {!model.isAvailable && (
                          <Badge variant="secondary" className="text-xs">Soon</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{model.description}</p>
                      <p className="text-xs font-medium">${model.cost}/request</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Content Prompt</label>
                <Textarea
                  placeholder="Describe the content you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={generateContent}
                disabled={!prompt.trim() || !selectedModel || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Library</CardTitle>
              <CardDescription>
                Manage your generated AI content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contents.map((content) => (
                  <div key={content.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getContentIcon(content.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{content.title}</h3>
                            <Badge className={getStatusColor(content.status)}>
                              {content.status}
                            </Badge>
                            <Badge variant="outline">
                              {content.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{content.description}</p>
                          <p className="text-xs text-gray-500">
                            Created: {content.createdAt.toLocaleString()}
                          </p>
                          {content.result && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                              <strong>Result:</strong> {content.result.substring(0, 200)}...
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(content.status)}
                        {content.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getContentIcon(model.type)}
                      {model.name}
                    </CardTitle>
                    <Badge variant={model.isAvailable ? 'default' : 'secondary'}>
                      {model.isAvailable ? 'Available' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <CardDescription>{model.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cost per request:</span>
                      <span className="font-medium">${model.cost}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Type:</span>
                      <span className="font-medium capitalize">{model.type}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contents.length}</div>
                <p className="text-xs text-gray-500 mt-1">Content items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">94%</div>
                <p className="text-xs text-gray-500 mt-1">Generation success</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12.45</div>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Track your AI content generation usage and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Bot className="h-4 w-4" />
                <AlertDescription>
                  Analytics dashboard coming soon. Track generation metrics, costs, and performance insights.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIContentHub;