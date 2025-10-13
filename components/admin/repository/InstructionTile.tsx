// components/admin/repository/InstructionTile.tsx
import { InstructionCard } from '@/types/instruction';
import { Clock, Target, DollarSign, BookOpen, ShoppingCart, Star, Eye, Download } from 'lucide-react';

interface InstructionTileProps {
  instruction: InstructionCard;
  onPreview?: (instruction: InstructionCard) => void;
  onPurchase?: (instruction: InstructionCard) => void;
  onUse?: (instruction: InstructionCard) => void;
}

export function InstructionTile({ instruction, onPreview, onPurchase, onUse }: InstructionTileProps) {
  const getCategoryColor = (category: string) => {
    const colors = {
      grammar: 'bg-purple-100 text-purple-800',
      vocabulary: 'bg-blue-100 text-blue-800',
      conversation: 'bg-green-100 text-green-800',
      culture: 'bg-orange-100 text-orange-800',
      assessment: 'bg-red-100 text-red-800'
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-200">
      {/* Thumbnail */}
      {instruction.thumbnailUrl && (
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-xl overflow-hidden">
          <img
            src={instruction.thumbnailUrl}
            alt={instruction.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient background if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute top-3 right-3">
            {instruction.isPurchased ? (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <BookOpen size={12} />
                Owned
              </span>
            ) : (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <DollarSign size={12} />
                ${instruction.purchasePrice}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 leading-tight">
            {instruction.title}
          </h3>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {instruction.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            {renderStars(instruction.rating)}
          </div>
          <span className="text-sm text-gray-600">
            {instruction.rating} ({instruction.reviewCount} reviews)
          </span>
        </div>

        {/* Author */}
        <p className="text-xs text-gray-500">by {instruction.author}</p>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Time Goal */}
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className="text-gray-400" />
          <span className="font-medium text-gray-700">Time Goal:</span>
          <span className="text-gray-900">{instruction.timeGoal}</span>
        </div>

        {/* Learning Outcome */}
        <div className="flex items-start gap-2 text-sm">
          <Target size={16} className="text-gray-400 mt-0.5" />
          <div>
            <span className="font-medium text-gray-700">Outcome: </span>
            <span className="text-gray-900">{instruction.learningOutcome}</span>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-1">
            <DollarSign size={16} />
            Value Proposition
          </div>
          <p className="text-sm text-blue-800">{instruction.valueProposition}</p>
        </div>

        {/* Tags and Categories */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(instruction.category)}`}>
            {instruction.category}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(instruction.difficulty)}`}>
            {instruction.difficulty}
          </span>
          {instruction.tags.slice(0, 2).map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
          {instruction.tags.length > 2 && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              +{instruction.tags.length - 2} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="flex gap-2">
          {instruction.isPurchased ? (
            <>
              <button 
                onClick={() => onUse?.(instruction)}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
              >
                <BookOpen size={16} />
                Use in Lesson
              </button>
              <button 
                onClick={() => onPreview?.(instruction)}
                className="bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-1"
              >
                <Eye size={16} />
                View
              </button>
              {instruction.fullContentUrl && (
                <button className="bg-green-100 text-green-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-1">
                  <Download size={16} />
                </button>
              )}
            </>
          ) : (
            <>
              <button 
                onClick={() => onPurchase?.(instruction)}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
              >
                <ShoppingCart size={16} />
                Purchase (${instruction.purchasePrice})
              </button>
              <button 
                onClick={() => onPreview?.(instruction)}
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