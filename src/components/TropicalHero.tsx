'use client';

import React from 'react';
import Image from 'next/image';
import { PlayCircle, Video, ChevronDown, Heart, Users, Music } from 'lucide-react';

export const TropicalHero = () => (
  <section className="min-h-screen relative overflow-hidden bg-tropical-gradient">
    {/* Animated Ocean Background */}
    <div className="absolute inset-0 bg-gradient-to-b from-tropical-ocean to-tropical-lagoon">
      <div className="absolute bottom-0 w-full h-32 bg-[url('/images/wave-pattern.svg')] bg-repeat-x animate-wave"></div>
    </div>
     
    {/* Floating Tropical Elements */}
    <div className="absolute top-20 left-10 animate-float">
      <div className="w-16 h-16 bg-gradient-to-br from-tropical-sunset to-tropical-coral rounded-full flex items-center justify-center shadow-lg">
        <Heart className="w-8 h-8 text-white" />
      </div>
    </div>
    <div className="absolute top-40 right-16 animate-float-delayed">
      <div className="w-20 h-20 bg-gradient-to-br from-tropical-palm to-tropical-lagoon rounded-full flex items-center justify-center shadow-lg">
        <Music className="w-10 h-10 text-white" />
      </div>
    </div>

    {/* Additional floating elements */}
    <div className="absolute top-60 left-1/4 animate-float">
      <div className="w-12 h-12 bg-gradient-to-br from-tropical-lagoon to-tropical-ocean rounded-full flex items-center justify-center shadow-lg">
        <Users className="w-6 h-6 text-white" />
      </div>
    </div>

    {/* Main Hero Content */}
    <div className="relative z-10 container mx-auto px-6 pt-32 text-center">
      <h1 className="font-tropical-heading text-6xl md:text-8xl font-bold mb-6 text-tropical-plumeria drop-shadow-2xl">
        Tahiti Speaks
      </h1>
       
      <p className="text-xl md:text-2xl font-tropical-body text-tropical-sand max-w-2xl mx-auto mb-12 leading-relaxed">
        Where every word connects you to the heart of Polynesian culture. 
        <span className="block mt-2 text-tropical-coral font-semibold">
          Your language journey begins in paradise.
        </span>
      </p>

      {/* CTA Buttons with Tropical Style */}
      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <button className="bg-tropical-coral hover:bg-tropical-sunset text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-3 tropical-button">
          <PlayCircle className="w-6 h-6" />
          Start Your Journey
        </button>
         
        <button className="border-2 border-tropical-plumeria text-tropical-plumeria hover:bg-tropical-plumeria hover:text-tropical-ocean px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center gap-3 tropical-button">
          <Video className="w-6 h-6" />
          Watch Preview
        </button>
      </div>
    </div>

    {/* Animated Scroll Indicator */}
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <ChevronDown className="w-8 h-8 text-tropical-plumeria" />
    </div>
  </section>
);

export default TropicalHero;