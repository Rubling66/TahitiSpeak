'use client';

import { useState } from 'react';
import { Play, Pause, Volume2, Heart, Star, MapPin, Camera } from 'lucide-react';

export const CulturalImmersion = () => {
  const [activeStory, setActiveStory] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const culturalStories = [
    {
      id: 1,
      title: "The Legend of Tahiti",
      description: "Discover how the island of Tahiti was formed according to Polynesian mythology",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20tahitian%20island%20with%20mountains%20and%20lagoon%20polynesian%20mythology%20style&image_size=landscape_16_9",
      duration: "8 min",
      category: "Mythology",
      difficulty: "Intermediate"
    },
    {
      id: 2,
      title: "Traditional Tahitian Dance",
      description: "Learn about the sacred movements and cultural significance of Ori Tahiti",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20tahitian%20dancers%20in%20colorful%20costumes%20performing%20ori%20tahiti&image_size=landscape_16_9",
      duration: "12 min",
      category: "Dance & Music",
      difficulty: "Beginner"
    },
    {
      id: 3,
      title: "Polynesian Navigation",
      description: "Explore the ancient art of wayfinding across the Pacific Ocean",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=polynesian%20navigation%20traditional%20outrigger%20canoe%20stars%20ocean%20wayfinding&image_size=landscape_16_9",
      duration: "15 min",
      category: "History",
      difficulty: "Advanced"
    }
  ];

  const culturalElements = [
    {
      icon: Heart,
      title: "Aroha Spirit",
      description: "Understanding love, compassion, and connection in Tahitian culture"
    },
    {
      icon: Star,
      title: "Sacred Places",
      description: "Explore marae temples and their spiritual significance"
    },
    {
      icon: MapPin,
      title: "Island Life",
      description: "Daily traditions and customs of Polynesian communities"
    },
    {
      icon: Camera,
      title: "Art & Crafts",
      description: "Traditional tattoos, carvings, and textile arts"
    }
  ];

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-tropical-plumeria to-tropical-sand">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-tropical-heading text-4xl md:text-5xl text-tropical-ocean mb-6">
            Cultural Immersion
          </h2>
          <p className="text-xl text-tropical-ocean/80 max-w-3xl mx-auto leading-relaxed">
            Dive deep into Tahitian culture through interactive stories, traditional practices, 
            and authentic experiences that bring the islands to life.
          </p>
        </div>

        {/* Featured Cultural Story */}
        <div className="mb-16">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-tropical-lagoon/20">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Story Image */}
              <div className="relative h-64 lg:h-auto">
                <img 
                  src={culturalStories[activeStory].image}
                  alt={culturalStories[activeStory].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button
                  onClick={togglePlay}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-300 group"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-tropical-ocean group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <Play className="w-8 h-8 text-tropical-ocean ml-1 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </button>
              </div>

              {/* Story Content */}
              <div className="p-8 lg:p-12">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white px-4 py-2 rounded-full text-sm font-semibold">
                    {culturalStories[activeStory].category}
                  </span>
                  <span className="text-tropical-ocean/60 text-sm font-medium">
                    {culturalStories[activeStory].duration}
                  </span>
                  <span className="text-tropical-ocean/60 text-sm">
                    {culturalStories[activeStory].difficulty}
                  </span>
                </div>

                <h3 className="font-tropical-heading text-3xl text-tropical-ocean mb-4">
                  {culturalStories[activeStory].title}
                </h3>
                
                <p className="text-tropical-ocean/80 text-lg leading-relaxed mb-8">
                  {culturalStories[activeStory].description}
                </p>

                <div className="flex items-center gap-4">
                  <button className="bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Listen Now
                  </button>
                  <button className="border-2 border-tropical-ocean text-tropical-ocean hover:bg-tropical-ocean hover:text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300">
                    Read More
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Story Navigation */}
          <div className="flex justify-center mt-8 gap-4">
            {culturalStories.map((story, index) => (
              <button
                key={story.id}
                onClick={() => setActiveStory(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === activeStory 
                    ? 'bg-tropical-coral scale-125' 
                    : 'bg-tropical-ocean/30 hover:bg-tropical-ocean/50'
                }`}
                aria-label={`View ${story.title}`}
              />
            ))}
          </div>
        </div>

        {/* Cultural Elements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {culturalElements.map((element, index) => {
            const IconComponent = element.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl p-8 shadow-xl border-2 border-tropical-lagoon/20 hover:border-tropical-coral hover:shadow-2xl transition-all duration-300 transform hover:scale-105 tropical-card group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-tropical-coral to-tropical-sunset rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                <h4 className="font-tropical-heading text-xl text-tropical-ocean mb-3">
                  {element.title}
                </h4>
                
                <p className="text-tropical-ocean/70 leading-relaxed">
                  {element.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-tropical-ocean to-tropical-lagoon rounded-3xl p-12 text-white">
            <h3 className="font-tropical-heading text-3xl mb-4">
              Ready to Explore Tahitian Culture?
            </h3>
            <p className="text-tropical-sand text-lg mb-8 max-w-2xl mx-auto">
              Join our cultural immersion program and discover the rich traditions, 
              stories, and wisdom of Polynesian heritage.
            </p>
            <button className="bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              Start Cultural Journey
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};