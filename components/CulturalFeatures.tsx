'use client';

import React from 'react';
import { Heart, Users, Music } from 'lucide-react';

export const CulturalFeatures = () => (
  <section className="py-20 bg-tropical-sand">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="font-tropical-heading text-4xl md:text-5xl text-tropical-ocean mb-4">
          More Than Language
        </h2>
        <p className="text-xl text-tropical-ocean/80 max-w-2xl mx-auto">
          Immerse yourself in the rich tapestry of Tahitian culture, traditions, and way of life
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Feature 1: Cultural Connection */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-tropical-lagoon/20 hover:border-tropical-coral transition-all duration-300 group tropical-card">
          <div className="w-16 h-16 bg-gradient-to-br from-tropical-coral to-tropical-sunset rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 tropical-icon">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-tropical-heading text-2xl text-tropical-ocean mb-4">
            Cultural Connection
          </h3>
          <p className="text-tropical-ocean/70 leading-relaxed">
            Learn through authentic stories, traditional songs, and cultural practices that bring the language to life.
          </p>
        </div>

        {/* Feature 2: Beautiful People */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-tropical-lagoon/20 hover:border-tropical-coral transition-all duration-300 group tropical-card">
          <div className="w-16 h-16 bg-gradient-to-br from-tropical-lagoon to-tropical-ocean rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 tropical-icon">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-tropical-heading text-2xl text-tropical-ocean mb-4">
            Connect with Locals
          </h3>
          <p className="text-tropical-ocean/70 leading-relaxed">
            Practice with native speakers and understand the warmth and beauty of Tahitian communication.
          </p>
        </div>

        {/* Feature 3: Island Rhythm */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-tropical-lagoon/20 hover:border-tropical-coral transition-all duration-300 group tropical-card">
          <div className="w-16 h-16 bg-gradient-to-br from-tropical-palm to-tropical-lagoon rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 tropical-icon">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-tropical-heading text-2xl text-tropical-ocean mb-4">
            Island Rhythm
          </h3>
          <p className="text-tropical-ocean/70 leading-relaxed">
            Feel the music and dance in every word. Learn the melodic flow of Tahitian speech patterns.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default CulturalFeatures;