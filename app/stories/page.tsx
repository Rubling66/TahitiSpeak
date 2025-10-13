// Stories Page - Main entry point for the Interactive Polynesian Story System
'use client';

import React, { useState } from 'react';
import { InteractiveStorySystem } from '@/components/story-system/InteractiveStorySystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Scroll, 
  Compass, 
  Sparkles,
  Users,
  TrendingUp,
  Award
} from 'lucide-react';

export default function StoriesPage() {
  const [showStorySystem, setShowStorySystem] = useState(false);

  if (showStorySystem) {
    return <InteractiveStorySystem />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-6">
            <Scroll className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Interactive Polynesian Stories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Immerse yourself in authentic Polynesian tales with branching narratives, 
            cultural annotations, and interactive choices that shape your journey through 
            Pacific Island traditions.
          </p>
          <Button 
            onClick={() => setShowStorySystem(true)}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 text-lg"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Enter Story World
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Compass className="h-5 w-5" />
                Branching Narratives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Make choices that influence the story's direction and discover multiple 
                endings based on your decisions and cultural understanding.
              </p>
            </CardContent>
          </Card>

          <Card className="border-teal-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700">
                <Sparkles className="h-5 w-5" />
                Cultural Annotations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Learn about Polynesian traditions, beliefs, and practices through 
                detailed annotations that provide context for every story element.
              </p>
            </CardContent>
          </Card>

          <Card className="border-cyan-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-700">
                <Users className="h-5 w-5" />
                Community Discussions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Engage with other learners, ask questions about cultural elements, 
                and share insights about the stories and their meanings.
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
                Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor your cultural authenticity score and track your journey 
                through different story paths and learning achievements.
              </p>
            </CardContent>
          </Card>

          <Card className="border-teal-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700">
                <Award className="h-5 w-5" />
                Authentic Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Experience stories curated by cultural experts and community 
                contributors to ensure authenticity and respect for traditions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-cyan-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-700">
                <BookOpen className="h-5 w-5" />
                Rich Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Explore a growing collection of traditional tales from across 
                Polynesia, each with unique cultural insights and learning opportunities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sample Stories Preview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Featured Stories
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">☀️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Maui and the Sun</h3>
              <p className="text-gray-600 text-sm">
                Follow the legendary trickster hero as he slows down the sun to help his people.
              </p>
              <Badge variant="secondary" className="mt-2">Beginner</Badge>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🚢</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">The Voyage of Kupe</h3>
              <p className="text-gray-600 text-sm">
                Navigate the vast Pacific with master wayfinder Kupe on his legendary journey.
              </p>
              <Badge variant="secondary" className="mt-2">Intermediate</Badge>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🌋</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Pele and the Sacred Fire</h3>
              <p className="text-gray-600 text-sm">
                Experience the power of the Hawaiian volcano goddess in her search for home.
              </p>
              <Badge variant="secondary" className="mt-2">Advanced</Badge>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-gray-600 mb-6">
            Dive into the rich world of Polynesian storytelling and discover the wisdom of the Pacific Islands.
          </p>
          <Button 
            onClick={() => setShowStorySystem(true)}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 text-lg"
          >
            <Scroll className="h-5 w-5 mr-2" />
            Start Reading Stories
          </Button>
        </div>
      </div>
    </div>
  );
}