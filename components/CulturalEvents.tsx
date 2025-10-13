'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  Heart, 
  Share2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageCircle,
  Gift,
  Award,
  Sparkles,
  Globe,
  Camera,
  Mic,
  Video,
  Radio,
  Headphones,
  Music,
  Palette,
  Utensils,
  Mountain,
  Waves,
  Sun,
  Moon,
  Compass,
  Map,
  Flag,
  Crown,
  Zap,
  TrendingUp,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Plus,
  Bookmark,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  UserPlus,
  Bell,
  BellOff
} from 'lucide-react';
import { useCollaboration } from '@/hooks/useCollaboration';

interface CulturalEventsProps {
  onClose?: () => void;
}

const CulturalEvents: React.FC<CulturalEventsProps> = ({ onClose }) => {
  const { state, actions } = useCollaboration();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const categories = [
    { id: 'all', name: 'All Events', icon: '🌺', color: 'bg-purple-500' },
    { id: 'workshop', name: 'Workshops', icon: '🎨', color: 'bg-blue-500' },
    { id: 'tour', name: 'Virtual Tours', icon: '🗺️', color: 'bg-green-500' },
    { id: 'cooking', name: 'Cooking Classes', icon: '👨‍🍳', color: 'bg-orange-500' },
    { id: 'dance', name: 'Dance Lessons', icon: '💃', color: 'bg-pink-500' },
    { id: 'music', name: 'Music Sessions', icon: '🎵', color: 'bg-indigo-500' },
    { id: 'storytelling', name: 'Storytelling', icon: '📚', color: 'bg-yellow-500' },
    { id: 'ceremony', name: 'Ceremonies', icon: '🏛️', color: 'bg-red-500' },
    { id: 'festival', name: 'Festivals', icon: '🎉', color: 'bg-teal-500' }
  ];

  const filteredEvents = state.virtualEvents.filter(event => {
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.culturalSignificance.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const upcomingEvents = filteredEvents.filter(event => 
    new Date(event.startTime) > currentTime
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const liveEvents = filteredEvents.filter(event => 
    event.status === 'live'
  );

  const pastEvents = filteredEvents.filter(event => 
    new Date(event.endTime) < currentTime
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const handleRegisterEvent = (eventId: string) => {
    if (registeredEvents.includes(eventId)) {
      setRegisteredEvents(prev => prev.filter(id => id !== eventId));
    } else {
      setRegisteredEvents(prev => [...prev, eventId]);
    }
  };

  const handleToggleFavorite = (eventId: string) => {
    if (favorites.includes(eventId)) {
      setFavorites(prev => prev.filter(id => id !== eventId));
    } else {
      setFavorites(prev => [...prev, eventId]);
    }
  };

  const formatEventTime = (date: Date) => {
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event: any) => {
    const now = currentTime;
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (event.status === 'live') return { status: 'live', color: 'bg-red-500', text: 'Live Now' };
    if (now < start) return { status: 'upcoming', color: 'bg-blue-500', text: 'Upcoming' };
    if (now >= start && now <= end) return { status: 'active', color: 'bg-green-500', text: 'Active' };
    return { status: 'ended', color: 'bg-gray-500', text: 'Ended' };
  };

  const EventCard = ({ event, index }: { event: any; index: number }) => {
    const eventStatus = getEventStatus(event);
    const isRegistered = registeredEvents.includes(event.id);
    const isFavorite = favorites.includes(event.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
      >
        {/* Event Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.thumbnail}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Status Badge */}
          <div className={`absolute top-3 left-3 px-2 py-1 ${eventStatus.color} text-white text-xs font-medium rounded-full flex items-center space-x-1`}>
            {eventStatus.status === 'live' && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
            <span>{eventStatus.text}</span>
          </div>

          {/* Actions */}
          <div className="absolute top-3 right-3 flex space-x-2">
            <button
              onClick={() => handleToggleFavorite(event.id)}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                isFavorite ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 bg-white/20 text-white rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Live Indicator */}
          {event.status === 'live' && (
            <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Live</span>
              <span className="text-xs opacity-80">{event.currentViewers} watching</span>
            </div>
          )}

          {/* Duration */}
          <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
            {event.duration} min
          </div>
        </div>

        {/* Event Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{event.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{event.host}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 text-yellow-500 mb-1">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">{event.rating}</span>
              </div>
              <div className="text-xs text-gray-500">{event.participants} joined</div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

          {/* Cultural Significance */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">Cultural Significance</span>
            </div>
            <p className="text-xs text-purple-600">{event.culturalSignificance}</p>
          </div>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{formatEventTime(new Date(event.startTime))}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{event.duration} minutes</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Globe className="w-4 h-4" />
              <span className="capitalize">{event.language}</span>
            </div>
            {event.location && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{event.tags.length - 3} more
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            {event.status === 'live' ? (
              <button
                onClick={() => setSelectedEvent(event.id)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Join Live</span>
              </button>
            ) : eventStatus.status === 'upcoming' ? (
              <button
                onClick={() => handleRegisterEvent(event.id)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  isRegistered
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isRegistered ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{isRegistered ? 'Registered' : 'Register'}</span>
              </button>
            ) : eventStatus.status === 'ended' ? (
              <button
                onClick={() => setSelectedEvent(event.id)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Watch Replay</span>
              </button>
            ) : (
              <button
                onClick={() => setSelectedEvent(event.id)}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Join Now</span>
              </button>
            )}

            <button
              onClick={() => setSelectedEvent(event.id)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (selectedEvent) {
    const event = state.virtualEvents.find(e => e.id === selectedEvent);
    if (!event) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col"
      >
        {/* Event Player Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedEvent(null)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-semibold">{event.title}</h2>
              <p className="text-sm text-gray-300">{event.host}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {event.status === 'live' && (
              <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>Live</span>
                <span className="text-xs opacity-80">{event.currentViewers} watching</span>
              </div>
            )}
            
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setSelectedEvent(null)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Event Player */}
        <div className="flex-1 relative bg-black">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                {event.status === 'live' ? (
                  <Radio className="w-16 h-16 text-red-500" />
                ) : (
                  <Play className="w-16 h-16 text-white" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
              <p className="text-gray-300 mb-4">{event.description}</p>
              {event.status === 'live' ? (
                <div className="text-red-400">🔴 Live Event in Progress</div>
              ) : (
                <div className="text-gray-400">Event Player</div>
              )}
            </div>
          </div>

          {/* Player Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="flex items-center justify-center space-x-4">
              <button className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                <Play className="w-6 h-6 text-white" />
              </button>
              <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                <Volume2 className="w-5 h-5 text-white" />
              </button>
              <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                <Maximize className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Event Info Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Event Details</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Cultural Significance</h4>
                <p className="text-sm text-gray-600">{event.culturalSignificance}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">What You'll Learn</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {event.learningObjectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Materials Needed</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {event.materialsNeeded.map((material: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{material}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {event.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Prerequisites</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {event.prerequisites.map((prereq: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{prereq}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-7xl mx-auto h-[85vh] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cultural Events</h1>
              <p className="text-purple-100">Immerse yourself in Tahitian culture</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setNotifications(!notifications)}
              className={`p-2 rounded-lg transition-colors ${
                notifications ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{liveEvents.length}</div>
            <div className="text-sm text-purple-100">Live Now</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <div className="text-sm text-purple-100">Upcoming</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{registeredEvents.length}</div>
            <div className="text-sm text-purple-100">Registered</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{favorites.length}</div>
            <div className="text-sm text-purple-100">Favorites</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* View Mode */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'calendar' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilterCategory(category.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                filterCategory === category.id
                  ? `${category.color} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{category.icon}</span>
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Live Events */}
        {liveEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span>Live Now</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.slice(0, 6).map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Past Events (Replays Available)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.slice(0, 6).map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          </div>
        )}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No events found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CulturalEvents;
export { CulturalEvents };