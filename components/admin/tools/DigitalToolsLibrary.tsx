'use client';

import { useState, useEffect } from 'react';
import { 
  Tool, 
  Play, 
  Pause, 
  Settings, 
  Download, 
  Share2, 
  Star, 
  Clock, 
  Users, 
  Zap,
  Gamepad2,
  Mic,
  MessageSquare,
  Brain,
  Target,
  Search,
  Filter,
  Grid,
  List,
  Plus,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Code,
  Maximize,
  Volume2,
  VolumeX
} from 'lucide-react';
import { InteractiveToolResource, syntheticDigitalResources } from '@/types/digital-resources';

interface DigitalToolsLibraryProps {
  onToolSelect?: (tool: InteractiveToolResource) => void;
  onToolEmbed?: (tool: InteractiveToolResource) => void;
}

export function DigitalToolsLibrary({ onToolSelect, onToolEmbed }: DigitalToolsLibraryProps) {
  const [tools, setTools] = useState<InteractiveToolResource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToolType, setSelectedToolType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTool, setSelectedTool] = useState<InteractiveToolResource | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const toolTypes = ['all', 'quiz', 'game', 'simulation', 'flashcards', 'pronunciation', 'conversation'];
  const difficulties = ['all', 1, 2, 3, 4, 5];

  useEffect(() => {
    // Filter only interactive tools from synthetic data
    const interactiveTools = syntheticDigitalResources.filter(
      resource => resource.resourceType === 'interactive_tool'
    ) as InteractiveToolResource[];
    setTools(interactiveTools);
  }, []);

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesToolType = selectedToolType === 'all' || tool.tool.toolType === selectedToolType;
    const matchesDifficulty = selectedDifficulty === 'all' || tool.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesToolType && matchesDifficulty;
  });

  const getToolTypeIcon = (toolType: string) => {
    const icons = {
      quiz: Brain,
      game: Gamepad2,
      simulation: Target,
      flashcards: Zap,
      pronunciation: Mic,
      conversation: MessageSquare
    };
    return icons[toolType as keyof typeof icons] || Tool;
  };

  const getToolTypeColor = (toolType: string) => {
    const colors = {
      quiz: 'bg-purple-100 text-purple-800',
      game: 'bg-green-100 text-green-800',
      simulation: 'bg-blue-100 text-blue-800',
      flashcards: 'bg-yellow-100 text-yellow-800',
      pronunciation: 'bg-red-100 text-red-800',
      conversation: 'bg-indigo-100 text-indigo-800'
    };
    return colors[toolType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return 'Beginner';
    if (difficulty <= 3) return 'Intermediate';
    return 'Advanced';
  };

  const handleToolPreview = (tool: InteractiveToolResource) => {
    setSelectedTool(tool);
    setShowPreview(true);
  };

  const handleToolUse = (tool: InteractiveToolResource) => {
    if (onToolSelect) {
      onToolSelect(tool);
    } else {
      // Open tool in new window/tab
      window.open(`/tools/${tool.id}`, '_blank');
    }
  };

  const handleToolEmbed = (tool: InteractiveToolResource) => {
    if (onToolEmbed) {
      onToolEmbed(tool);
    } else {
      // Copy embed code to clipboard
      if (tool.tool.embedCode) {
        navigator.clipboard.writeText(tool.tool.embedCode);
        // Show success message
      }
    }
  };

  const ToolCard = ({ tool }: { tool: InteractiveToolResource }) => {
    const IconComponent = getToolTypeIcon(tool.tool.toolType);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <IconComponent size={48} className="text-white opacity-80" />
          </div>
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getToolTypeColor(tool.tool.toolType)}`}>
              {tool.tool.toolType}
            </span>
          </div>
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tool.difficulty)}`}>
              {getDifficultyLabel(tool.difficulty)}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{tool.title}</h3>
          <p className="text-sm text-gray-600 mb-2">by {tool.author}</p>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{tool.description}</p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{tool.estimatedDuration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{tool.downloads}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={12} />
              <span>{tool.rating}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleToolUse(tool)}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1"
            >
              <Play size={14} />
              Use Tool
            </button>
            <button
              onClick={() => handleToolPreview(tool)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => handleToolEmbed(tool)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Code size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ToolListItem = ({ tool }: { tool: InteractiveToolResource }) => {
    const IconComponent = getToolTypeIcon(tool.tool.toolType);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
            <IconComponent size={24} className="text-white opacity-80" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{tool.title}</h3>
                <p className="text-sm text-gray-600 mb-2">by {tool.author}</p>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{tool.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                  <span className={`px-2 py-1 rounded-full font-medium ${getToolTypeColor(tool.tool.toolType)}`}>
                    {tool.tool.toolType}
                  </span>
                  <span className={`px-2 py-1 rounded-full font-medium ${getDifficultyColor(tool.difficulty)}`}>
                    {getDifficultyLabel(tool.difficulty)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{tool.estimatedDuration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{tool.downloads}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} />
                    <span>{tool.rating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {tool.tool.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {feature}
                    </span>
                  ))}
                  {tool.tool.features.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{tool.tool.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleToolUse(tool)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                >
                  <Play size={14} />
                  Use Tool
                </button>
                <button
                  onClick={() => handleToolPreview(tool)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleToolEmbed(tool)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Code size={14} />
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  <Edit size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Digital Tools Library</h1>
            <p className="text-gray-600">Interactive tools for enhanced Tahitian language learning</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={16} />
              Import Tool
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={16} />
              Create Tool
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedToolType}
            onChange={(e) => setSelectedToolType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {toolTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty === 'all' ? 'All Levels' : getDifficultyLabel(Number(difficulty))}
              </option>
            ))}
          </select>

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredTools.length} of {tools.length} tools
        </p>
      </div>

      {/* Tools Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTools.map((tool) => (
            <ToolListItem key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <Tool size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tools found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or create a new tool.</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create New Tool
          </button>
        </div>
      )}

      {/* Tool Preview Modal */}
      {showPreview && selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedTool.title}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600 mb-4">{selectedTool.description}</p>
                  
                  <h4 className="font-medium mb-2">Features</h4>
                  <ul className="list-disc list-inside text-gray-600 mb-4">
                    {selectedTool.tool.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                  
                  <h4 className="font-medium mb-2">Instructions</h4>
                  <ol className="list-decimal list-inside text-gray-600 mb-4">
                    {selectedTool.tool.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Tool Preview</h4>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Tool size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">Tool preview would appear here</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleToolUse(selectedTool)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={16} />
                      Open Tool
                    </button>
                    <button
                      onClick={() => handleToolEmbed(selectedTool)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Code size={16} />
                      Embed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}