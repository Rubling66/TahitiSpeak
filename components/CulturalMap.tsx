'use client';

import { useState } from 'react';
import { MapPin, Info, Camera, Music, Utensils, Mountain } from 'lucide-react';

export const CulturalMap = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const culturalLocations = [
    {
      id: 1,
      name: "Papeete Market",
      type: "marketplace",
      icon: Utensils,
      position: { x: 45, y: 60 },
      description: "Traditional Tahitian market with local foods, crafts, and cultural experiences",
      highlights: ["Poisson Cru", "Local Fruits", "Handmade Crafts"],
      difficulty: "Beginner"
    },
    {
      id: 2,
      name: "Marae Temples",
      type: "sacred",
      icon: Mountain,
      position: { x: 30, y: 40 },
      description: "Ancient Polynesian temples and sacred gathering places",
      highlights: ["Sacred Rituals", "Ancient History", "Spiritual Practices"],
      difficulty: "Intermediate"
    },
    {
      id: 3,
      name: "Cultural Center",
      type: "cultural",
      icon: Music,
      position: { x: 65, y: 35 },
      description: "Hub for traditional dance, music, and cultural performances",
      highlights: ["Ori Tahiti Dance", "Traditional Music", "Cultural Shows"],
      difficulty: "Beginner"
    },
    {
      id: 4,
      name: "Artisan Village",
      type: "crafts",
      icon: Camera,
      position: { x: 55, y: 75 },
      description: "Traditional crafts, tattoo art, and local artisan workshops",
      highlights: ["Tattoo Art", "Wood Carving", "Textile Arts"],
      difficulty: "Advanced"
    },
    {
      id: 5,
      name: "Lagoon Tours",
      type: "nature",
      icon: MapPin,
      position: { x: 75, y: 50 },
      description: "Explore the crystal-clear lagoons and marine life",
      highlights: ["Snorkeling", "Marine Life", "Island Hopping"],
      difficulty: "Beginner"
    }
  ];

  const getLocationColor = (type) => {
    const colors = {
      marketplace: 'from-tropical-coral to-tropical-sunset',
      sacred: 'from-tropical-ocean to-tropical-lagoon',
      cultural: 'from-tropical-lagoon to-tropical-plumeria',
      crafts: 'from-tropical-sunset to-tropical-coral',
      nature: 'from-tropical-plumeria to-tropical-sand'
    };
    return colors[type] || 'from-tropical-coral to-tropical-sunset';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Beginner': 'bg-green-500',
      'Intermediate': 'bg-yellow-500',
      'Advanced': 'bg-red-500'
    };
    return colors[difficulty] || 'bg-gray-500';
  };

  return (
    <div className="bg-gradient-to-br from-tropical-lagoon to-tropical-ocean rounded-3xl shadow-2xl overflow-hidden border-2 border-white/20">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm p-6 border-b border-white/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-tropical-coral to-tropical-sunset rounded-2xl flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-tropical-heading text-xl text-white">Cultural Map</h3>
            <p className="text-tropical-sand text-sm">Explore authentic Tahitian experiences</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Interactive Map */}
        <div className="relative bg-gradient-to-br from-tropical-plumeria/20 to-tropical-sand/20 rounded-2xl h-80 mb-6 overflow-hidden border-2 border-white/10">
          {/* Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-tropical-lagoon/30 to-tropical-ocean/30" />
          
          {/* Island Shape */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-40 bg-gradient-to-br from-tropical-sand to-tropical-plumeria rounded-full opacity-60" />
          
          {/* Cultural Locations */}
          {culturalLocations.map((location) => {
            const IconComponent = location.icon;
            return (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location)}
                className={`absolute w-8 h-8 bg-gradient-to-br ${getLocationColor(location.type)} rounded-full flex items-center justify-center shadow-lg hover:scale-125 transition-all duration-300 transform hover:shadow-xl animate-pulse`}
                style={{
                  left: `${location.position.x}%`,
                  top: `${location.position.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                aria-label={`Explore ${location.name}`}
              >
                <IconComponent className="w-4 h-4 text-white" />
              </button>
            );
          })}

          {/* Floating Islands */}
          <div className="absolute top-4 right-4 w-12 h-8 bg-tropical-sand/40 rounded-full" />
          <div className="absolute bottom-6 left-6 w-8 h-6 bg-tropical-sand/40 rounded-full" />
          <div className="absolute top-1/3 left-1/4 w-6 h-4 bg-tropical-sand/40 rounded-full" />
        </div>

        {/* Location Details */}
        {selectedLocation ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${getLocationColor(selectedLocation.type)} rounded-xl flex items-center justify-center`}>
                  <selectedLocation.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-tropical-heading text-lg text-white">{selectedLocation.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 ${getDifficultyColor(selectedLocation.difficulty)} rounded-full`} />
                    <span className="text-tropical-sand text-sm">{selectedLocation.difficulty}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-tropical-sand hover:text-white transition-colors duration-300"
              >
                ✕
              </button>
            </div>

            <p className="text-tropical-sand/90 mb-4 leading-relaxed">
              {selectedLocation.description}
            </p>

            <div className="mb-4">
              <h5 className="text-white font-semibold mb-2">Cultural Highlights:</h5>
              <div className="flex flex-wrap gap-2">
                {selectedLocation.highlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="bg-white/20 text-tropical-sand px-3 py-1 rounded-full text-sm"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
              <Info className="w-4 h-4" />
              Learn More
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
            <MapPin className="w-12 h-12 text-tropical-sand mx-auto mb-4" />
            <h4 className="font-tropical-heading text-lg text-white mb-2">
              Discover Cultural Locations
            </h4>
            <p className="text-tropical-sand/80">
              Click on any location marker to explore authentic Tahitian cultural experiences and learn about local traditions.
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-tropical-coral to-tropical-sunset rounded-full" />
            <span className="text-tropical-sand text-sm">Markets & Food</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-tropical-ocean to-tropical-lagoon rounded-full" />
            <span className="text-tropical-sand text-sm">Sacred Sites</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-tropical-lagoon to-tropical-plumeria rounded-full" />
            <span className="text-tropical-sand text-sm">Cultural Centers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-tropical-sunset to-tropical-coral rounded-full" />
            <span className="text-tropical-sand text-sm">Arts & Crafts</span>
          </div>
        </div>
      </div>
    </div>
  );
};