// components/admin/repository/InstructionRepository.tsx
'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Grid, List, Star, BookOpen, Download, Eye } from 'lucide-react';
import { InstructionCard, syntheticInstructions } from '@/types/instruction';
import { InstructionTile } from './InstructionTile';

type ViewMode = 'grid' | 'list';
type SortOption = 'title' | 'rating' | 'price' | 'category' | 'difficulty';

export function InstructionRepository() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showPurchasedOnly, setShowPurchasedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('title');

  // Get unique categories and difficulties
  const categories = useMemo(() => {
    const cats = Array.from(new Set(syntheticInstructions.map(inst => inst.category)));
    return ['all', ...cats];
  }, []);

  const difficulties = useMemo(() => {
    const diffs = Array.from(new Set(syntheticInstructions.map(inst => inst.difficulty)));
    return ['all', ...diffs];
  }, []);

  // Filter and sort instructions
  const filteredInstructions = useMemo(() => {
    let filtered = syntheticInstructions.filter(instruction => {
      const matchesSearch = instruction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           instruction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           instruction.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || instruction.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || instruction.difficulty === selectedDifficulty;
      const matchesPurchased = !showPurchasedOnly || instruction.isPurchased;

      return matchesSearch && matchesCategory && matchesDifficulty && matchesPurchased;
    });

    // Sort instructions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.purchasePrice - b.purchasePrice;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
                 (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, selectedDifficulty, showPurchasedOnly, sortBy]);

  const handlePreview = (instruction: InstructionCard) => {
    console.log('Preview instruction:', instruction.title);
    // TODO: Implement preview modal
  };

  const handlePurchase = (instruction: InstructionCard) => {
    console.log('Purchase instruction:', instruction.title);
    // TODO: Implement purchase flow
  };

  const handleUse = (instruction: InstructionCard) => {
    console.log('Use instruction:', instruction.title);
    // TODO: Implement use in lesson flow
  };

  const stats = useMemo(() => {
    const total = syntheticInstructions.length;
    const purchased = syntheticInstructions.filter(inst => inst.isPurchased).length;
    const avgRating = syntheticInstructions.reduce((sum, inst) => sum + inst.rating, 0) / total;
    
    return { total, purchased, avgRating };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Instruction Repository</h1>
            <p className="text-gray-600">
              Discover and manage educational resources for Tahitian language learning
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
              placeholder="Search instructions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

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

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
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
          </select>
        </div>

        {/* Additional Filters and View Controls */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPurchasedOnly}
                onChange={(e) => setShowPurchasedOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show owned only
            </label>
            <span className="text-sm text-gray-500">
              {filteredInstructions.length} of {stats.total} resources
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
        {filteredInstructions.length > 0 ? (
          filteredInstructions.map(instruction => (
            viewMode === 'grid' ? (
              <InstructionTile
                key={instruction.id}
                instruction={instruction}
                onPreview={handlePreview}
                onPurchase={handlePurchase}
                onUse={handleUse}
              />
            ) : (
              <div key={instruction.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-4">
                  {instruction.thumbnailUrl && (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={instruction.thumbnailUrl}
                        alt={instruction.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">{instruction.title}</h3>
                      <div className="flex items-center gap-2 ml-4">
                        {instruction.isPurchased ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Owned</span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">${instruction.purchasePrice}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{instruction.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400" />
                        {instruction.rating}
                      </span>
                      <span>{instruction.category}</span>
                      <span>{instruction.difficulty}</span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={14} />
                        {instruction.timeGoal}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {instruction.isPurchased ? (
                        <>
                          <button 
                            onClick={() => handleUse(instruction)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Use in Lesson
                          </button>
                          <button 
                            onClick={() => handlePreview(instruction)}
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                          >
                            View
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handlePurchase(instruction)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            Purchase
                          </button>
                          <button 
                            onClick={() => handlePreview(instruction)}
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                          >
                            Preview
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No instructions found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}