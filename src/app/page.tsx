'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Users, Award, ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PublicLayout } from '@/components/layout/AppLayout';

export default function Home() {
  const featuredLessons = [
    {
      id: 'greetings-basics',
      title: 'Basic Greetings',
      description: 'Learn essential Tahitian greetings and polite expressions',
      level: 'Beginner',
      duration: '15 min',
      progress: 0,
      tags: ['greetings', 'basics']
    },
    {
      id: 'family-members',
      title: 'Family Members',
      description: 'Vocabulary for family relationships and kinship terms',
      level: 'Beginner',
      duration: '20 min',
      progress: 0,
      tags: ['family', 'vocabulary']
    },
    {
      id: 'numbers-counting',
      title: 'Numbers & Counting',
      description: 'Learn to count and use numbers in everyday situations',
      level: 'Beginner',
      duration: '18 min',
      progress: 0,
      tags: ['numbers', 'basics']
    }
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header with Polynesian Tattoo Design */}
      <header className="bg-white shadow-sm border-b relative overflow-hidden" role="banner">
        {/* Polynesian Tattoo Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 800 100" preserveAspectRatio="xMidYMid slice">
            {/* Traditional Polynesian Wave Pattern */}
            <path d="M0,50 Q100,20 200,50 T400,50 T600,50 T800,50" stroke="#1e40af" strokeWidth="2" fill="none" />
            <path d="M0,60 Q100,30 200,60 T400,60 T600,60 T800,60" stroke="#1e40af" strokeWidth="1.5" fill="none" />
            
            {/* Geometric Tribal Elements */}
            <g transform="translate(50,25)">
              <polygon points="0,0 10,5 20,0 15,15 5,15" fill="#1e40af" opacity="0.3" />
              <polygon points="25,10 35,15 45,10 40,25 30,25" fill="#1e40af" opacity="0.2" />
            </g>
            
            <g transform="translate(150,35)">
              <polygon points="0,0 8,4 16,0 12,12 4,12" fill="#1e40af" opacity="0.3" />
              <polygon points="20,8 28,12 36,8 32,20 24,20" fill="#1e40af" opacity="0.2" />
            </g>
            
            <g transform="translate(250,20)">
              <polygon points="0,0 12,6 24,0 18,18 6,18" fill="#1e40af" opacity="0.3" />
            </g>
            
            <g transform="translate(350,30)">
              <polygon points="0,0 10,5 20,0 15,15 5,15" fill="#1e40af" opacity="0.3" />
              <polygon points="25,10 35,15 45,10 40,25 30,25" fill="#1e40af" opacity="0.2" />
            </g>
            
            <g transform="translate(450,25)">
              <polygon points="0,0 8,4 16,0 12,12 4,12" fill="#1e40af" opacity="0.3" />
            </g>
            
            <g transform="translate(550,35)">
              <polygon points="0,0 12,6 24,0 18,18 6,18" fill="#1e40af" opacity="0.3" />
              <polygon points="30,5 38,9 46,5 42,17 34,17" fill="#1e40af" opacity="0.2" />
            </g>
            
            <g transform="translate(650,20)">
              <polygon points="0,0 10,5 20,0 15,15 5,15" fill="#1e40af" opacity="0.3" />
            </g>
            
            <g transform="translate(750,30)">
              <polygon points="0,0 8,4 16,0 12,12 4,12" fill="#1e40af" opacity="0.3" />
            </g>
            
            {/* Tiki-inspired Elements */}
            <g transform="translate(100,45)">
              <rect x="0" y="0" width="4" height="20" fill="#1e40af" opacity="0.2" />
              <rect x="6" y="0" width="4" height="20" fill="#1e40af" opacity="0.2" />
              <rect x="12" y="0" width="4" height="20" fill="#1e40af" opacity="0.2" />
            </g>
            
            <g transform="translate(300,45)">
              <rect x="0" y="0" width="3" height="15" fill="#1e40af" opacity="0.2" />
              <rect x="5" y="0" width="3" height="15" fill="#1e40af" opacity="0.2" />
              <rect x="10" y="0" width="3" height="15" fill="#1e40af" opacity="0.2" />
            </g>
            
            <g transform="translate(500,45)">
              <rect x="0" y="0" width="4" height="18" fill="#1e40af" opacity="0.2" />
              <rect x="6" y="0" width="4" height="18" fill="#1e40af" opacity="0.2" />
            </g>
            
            <g transform="translate(700,45)">
              <rect x="0" y="0" width="3" height="15" fill="#1e40af" opacity="0.2" />
              <rect x="5" y="0" width="3" height="15" fill="#1e40af" opacity="0.2" />
              <rect x="10" y="0" width="3" height="15" fill="#1e40af" opacity="0.2" />
            </g>
          </svg>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo with Polynesian-inspired design */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center relative overflow-hidden" aria-hidden="true">
                {/* Subtle tattoo pattern overlay on logo */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 40 40">
                    <path d="M5,20 Q15,10 25,20 T35,20" stroke="white" strokeWidth="1" fill="none" />
                    <polygon points="10,15 15,18 20,15 17,25 13,25" fill="white" opacity="0.3" />
                    <polygon points="20,25 25,28 30,25 27,35 23,35" fill="white" opacity="0.3" />
                  </svg>
                </div>
                <BookOpen className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tahitian French Tutor</h1>
                <p className="text-sm text-gray-600">Learn Tahitian through French</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
              <Button variant="primary" size="sm" ariaLabel="Start learning with Tahitian French Tutor">
                Get Started
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom border with subtle Polynesian pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 opacity-30"></div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4" aria-labelledby="hero-heading">
        <div className="max-w-4xl mx-auto text-center">
          <h2 id="hero-heading" className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Master Tahitian Through
            <span className="text-blue-600 block">Interactive Lessons</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Learn Tahitian language and culture with our comprehensive French-to-Tahitian learning platform. 
            Perfect for French speakers wanting to explore Polynesian heritage.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center" role="group" aria-label="Get started actions">
            <Button size="lg" className="flex items-center gap-2" ariaLabel="Start learning Tahitian">
              <Play className="w-5 h-5" aria-hidden="true" />
              Start Learning
            </Button>
            <Button variant="outline" size="lg" ariaLabel="Browse available lessons">
              Browse Lessons
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto" role="list">
            <div className="text-center" role="listitem">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Interactive Lessons</h3>
              <p className="text-gray-600 text-sm">Engaging content with audio, exercises, and cultural context</p>
            </div>
            
            <div className="text-center" role="listitem">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cultural Immersion</h3>
              <p className="text-gray-600 text-sm">Learn language through Polynesian culture and traditions</p>
            </div>
            
            <div className="text-center" role="listitem">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600 text-sm">Monitor your learning journey with detailed analytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Lessons */}
      <section className="py-16 px-4 bg-white" aria-labelledby="featured-lessons-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="featured-lessons-heading" className="text-3xl font-bold text-gray-900 mb-4">Featured Lessons</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Start your Tahitian learning journey with these carefully crafted beginner lessons
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Featured lessons">
            {featuredLessons.map((lesson) => (
              <Card key={lesson.id} hover className="h-full" role="listitem">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="primary" size="sm" aria-label={`Difficulty level: ${lesson.level}`}>{lesson.level}</Badge>
                    <span className="text-sm text-gray-500" aria-label={`Estimated duration: ${lesson.duration}`}>{lesson.duration}</span>
                  </div>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 mb-4">{lesson.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {lesson.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Link href={`/lessons/${lesson.id}`}>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2" ariaLabel={`Start lesson: ${lesson.title}`}>
                      Start Lesson
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link href="/lessons">
              <Button variant="primary" size="lg" ariaLabel="View all available lessons">
                View All Lessons
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4" role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">Tahitian French Tutor</span>
              </div>
              <p className="text-gray-400 mb-4">
                Learn Tahitian language and culture through interactive lessons designed for French speakers.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Learn</h3>
              <nav aria-label="Learning resources">
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/lessons" className="hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">All Lessons</Link></li>
                  <li><Link href="/vocabulary" className="hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">Vocabulary</Link></li>
                  <li><Link href="/culture" className="hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">Culture</Link></li>
                </ul>
              </nav>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <nav aria-label="Support resources">
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/help" className="hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">Help Center</Link></li>
                  <li><Link href="/about" className="hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">About</Link></li>
                  <li><Link href="/contact" className="hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">Contact</Link></li>
                </ul>
              </nav>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Tahitian French Tutor. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </PublicLayout>
  );
}
