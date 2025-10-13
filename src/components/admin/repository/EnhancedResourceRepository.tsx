// components/admin/repository/EnhancedResourceRepository.tsx
'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Grid, List, Star, BookOpen, Download, Eye, Play, FileText, Headphones, Video, Tool, ClipboardList, Package } from 'lucide-react';
import { DigitalResource, ResourceType, syntheticDigitalResources } from '@/types/digital-resources';

type ViewMode = 'grid' | 'list';
type SortOption = 'title' | 'rating' | 'price' | 'category' | 'difficulty' | 'createdAt';

interface ResourceTileProps {
  resource: DigitalResource;
  onPreview?: (resource: DigitalResource) => void;
  onPurchase?: (resource: DigitalResource) => void;
  onUse?: (resource: DigitalResource) => void;
}

function ResourceTile({ resource, onPreview, onPurchase, onUse }: ResourceTileProps) {
  const getResourceTypeIcon = (type: ResourceType) => {
    const icons = {
      lesson_plan: FileText,
      ebook: BookOpen,
      worksheet: ClipboardList,
      audio_lesson: Headphones,
      video_tutorial: Video,
      interactive_tool: Tool,
      assessment_pack: ClipboardList,
      teaching_kit: Package
    };
    return icons[type] || FileText;
  };

  const getResourceTypeColor = (type: ResourceType) => {
    const colors = {
      lesson_plan: 'bg-blue-100 text-blue-800',
      ebook: 'bg-green-100 text-green-800',
      worksheet: 'bg-purple-100 text-purple-800',
      audio_lesson: 'bg-orange-100 text-orange-800',
      video_tutorial: 'bg-red-100 text-red-800',
      interactive_tool: 'bg-yellow-100 text-yellow-800',
      assessment_pack: 'bg-indigo-100 text-indigo-800',
      teaching_kit: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      grammar: 'bg-purple-100 text-purple-800',
      vocabulary: 'bg-blue-100 text-blue-800',
      conversation: 'bg-green-100 text-green-800',
      culture: 'bg-orange-100 text-orange-800',
      assessment: 'bg-red-100 text-red-800',
      pronunciation: 'bg-yellow-100 text-yellow-800',
      writing: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const ResourceIcon = getResourceTypeIcon(resource.resourceType);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-200">
      {/* Header with Resource Type Icon */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <ResourceIcon size={64} className="text-blue-400 opacity-50" />
        </div>
        <div className="absolute top-3 left-3">
          <span className={`text-xs px-2 py-1 rounded-full ${getResourceTypeColor(resource.resourceType)}`}>
            {resource.resourceType.replace('_', ' ')}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          {resource.isPurchased ? (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <BookOpen size={12} />
              Owned
            </span>
          ) : (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              ${resource.pricing.basePrice}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 leading-tight mb-2">
            {resource.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {resource.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {renderStars(resource.userRating.averageRating)}
            </div>
            <span className="text-sm text-gray-600">
              {resource.userRating.averageRating} ({resource.userRating.totalRatings} reviews)
            </span>
          </div>

          {/* Author */}
          <p className="text-xs text-gray-500">by {resource.author}</p>
        </div>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Duration:</span>
            <span className="text-gray-900">{resource.estimatedDuration}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Level:</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(resource.level)}`}>
              {resource.level}
            </span>
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg mb-4">
          <div className="text-sm font-medium text-blue-900 mb-1">Learning Objectives</div>
          <ul className="text-sm text-blue-800 space-y-1">
            {resource.learningObjectives.slice(0, 2).map((objective, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-blue-600 mt-1">•</span>
                <span className="line-clamp-1">{objective}</span>
              </li>
            ))}
            {resource.learningObjectives.length > 2 && (
              <li className="text-blue-600 text-xs">+{resource.learningObjectives.length - 2} more objectives</li>
            )}
          </ul>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(resource.category)}`}>
            {resource.category}
          </span>
          {resource.tags.slice(0, 2).map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
          {resource.tags.length > 2 && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              +{resource.tags.length - 2} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {resource.isPurchased ? (
            <>
              <button 
                onClick={() => onUse?.(resource)}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
              >
                <Play size={16} />
                Use Resource
              </button>
              <button 
                onClick={() => onPreview?.(resource)}
                className="bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-1"
              >
                <Eye size={16} />
              </button>
              <button className="bg-green-100 text-green-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-1">
                <Download size={16} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onPurchase?.(resource)}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
              >
                <Package size={16} />
                Purchase (${resource.pricing.basePrice})
              </button>
              <button 
                onClick={() => onPreview?.(resource)}
                className="bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-1"
              >
                <Eye size={16} />
                Preview
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function EnhancedResourceRepository() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('title');

  // Get unique resource types and categories
  const resourceTypes = useMemo(() => {
    const types = Array.from(new Set(syntheticDigitalResources.map(resource => resource.resourceType)));
    return ['all', ...types];
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(syntheticDigitalResources.map(resource => resource.category)));
    return ['all', ...cats];
  }, []);

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    let filtered = syntheticDigitalResources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesResourceType = selectedResourceType === 'all' || resource.resourceType === selectedResourceType;
      const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
      const matchesFeatured = !featuredOnly || resource.isFeatured;

      return matchesSearch && matchesResourceType && matchesCategory && matchesFeatured;
    });

    // Sort resources
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return b.userRating.averageRating - a.userRating.averageRating;
        case 'price':
          return a.pricing.basePrice - b.pricing.basePrice;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          return (difficultyOrder[a.level as keyof typeof difficultyOrder] || 0) - 
                 (difficultyOrder[b.level as keyof typeof difficultyOrder] || 0);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedResourceType, selectedCategory, featuredOnly, sortBy]);

  const handlePreview = (resource: DigitalResource) => {
    console.log('Preview resource:', resource.title);
    // TODO: Implement preview modal
  };

  const handlePurchase = (resource: DigitalResource) => {
    console.log('Purchase resource:', resource.title);
    // TODO: Implement purchase flow
  };

  const handleUse = (resource: DigitalResource) => {
    console.log('Use resource:', resource.title);
    // TODO: Implement use in lesson flow
  };

  const stats = useMemo(() => {
    const total = syntheticDigitalResources.length;
    const purchased = syntheticDigitalResources.filter(resource => resource.isPurchased).length;
    const featured = syntheticDigitalResources.filter(resource => resource.isFeatured).length;
    const avgRating = syntheticDigitalResources.reduce((sum, resource) => sum + resource.userRating.averageRating, 0) / total;
    
    return { total, purchased, featured, avgRating };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Digital Resource Repository</h1>
            <p className="text-gray-600">
              Comprehensive collection of lesson plans, ebooks, and digital tools for Tahitian language learning
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-gray-500">Total Resources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.purchased}</div>
              <div className="text-gray-500">Owned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.featured}</div>
              <div className="text-gray-500">Featured</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</div>
              <div className="text-gray-500">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Resource Type Filter */}
          <select
            value={selectedResourceType}
            onChange={(e) => setSelectedResourceType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {resourceTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="title">Sort by Title</option>
            <option value="rating">Sort by Rating</option>
            <option value="price">Sort by Price</option>
            <option value="category">Sort by Category</option>
            <option value="difficulty">Sort by Difficulty</option>
            <option value="createdAt">Sort by Date</option>
          </select>
        </div>

        {/* Additional Filters and View Controls */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Featured only
            </label>
            <span className="text-sm text-gray-500">
              {filteredResources.length} of {stats.total} resources
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={`${viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
        : 'space-y-4'
      }`}>
        {filteredResources.length > 0 ? (
          filteredResources.map(resource => (
            <ResourceTile
              key={resource.id}
              resource={resource}
              onPreview={handlePreview}
              onPurchase={handlePurchase}
              onUse={handleUse}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}