'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen, Users, Award, ArrowRight, Play, Sparkles, Globe, Music,
  Headphones, MessageCircle, Star, ChevronLeft, ChevronRight, Volume2,
  Mic, Trophy, Flame, Target
} from 'lucide-react';
import { PublicLayout } from '@/components/layout/AppLayout';

// Typewriter Effect Component
function TypewriterText({ phrases, className }: { phrases: string[], className?: string }) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[currentPhraseIndex];
    const speed = isDeleting ? 50 : 100;

    if (!isDeleting && currentText === phrase) {
      setTimeout(() => setIsDeleting(true), 2000);
      return;
    }

    if (isDeleting && currentText === '') {
      setIsDeleting(false);
      setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      return;
    }

    const timeout = setTimeout(() => {
      setCurrentText(prev =>
        isDeleting
          ? prev.slice(0, -1)
          : phrase.slice(0, prev.length + 1)
      );
    }, speed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentPhraseIndex, phrases]);

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// Floating Particles Component - uses fixed positions to avoid hydration mismatch
function FloatingParticles() {
  // Pre-defined particle positions to avoid hydration issues with Math.random()
  const particles = [
    { size: 8, left: 5, top: 10, opacity: 0.2, duration: 15, delay: 0 },
    { size: 6, left: 15, top: 25, opacity: 0.15, duration: 18, delay: 2 },
    { size: 10, left: 25, top: 5, opacity: 0.25, duration: 12, delay: 1 },
    { size: 7, left: 35, top: 40, opacity: 0.2, duration: 20, delay: 3 },
    { size: 5, left: 45, top: 15, opacity: 0.3, duration: 14, delay: 0 },
    { size: 9, left: 55, top: 55, opacity: 0.18, duration: 16, delay: 4 },
    { size: 6, left: 65, top: 30, opacity: 0.22, duration: 19, delay: 1 },
    { size: 8, left: 75, top: 70, opacity: 0.15, duration: 13, delay: 2 },
    { size: 7, left: 85, top: 20, opacity: 0.28, duration: 17, delay: 0 },
    { size: 5, left: 95, top: 45, opacity: 0.2, duration: 15, delay: 3 },
    { size: 9, left: 10, top: 60, opacity: 0.25, duration: 18, delay: 2 },
    { size: 6, left: 20, top: 80, opacity: 0.18, duration: 14, delay: 4 },
    { size: 8, left: 30, top: 65, opacity: 0.22, duration: 16, delay: 1 },
    { size: 7, left: 50, top: 85, opacity: 0.15, duration: 20, delay: 0 },
    { size: 10, left: 60, top: 75, opacity: 0.3, duration: 12, delay: 3 },
    { size: 5, left: 70, top: 50, opacity: 0.2, duration: 19, delay: 2 },
    { size: 8, left: 80, top: 90, opacity: 0.25, duration: 15, delay: 1 },
    { size: 6, left: 90, top: 35, opacity: 0.18, duration: 17, delay: 4 },
    { size: 9, left: 40, top: 95, opacity: 0.22, duration: 13, delay: 0 },
    { size: 7, left: 2, top: 50, opacity: 0.15, duration: 18, delay: 3 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size + 'px',
            height: p.size + 'px',
            left: p.left + '%',
            top: p.top + '%',
            background: `rgba(0, 212, 170, ${p.opacity})`,
            animation: `float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </div>
  );
}

// Interactive Word Demo Component
function InteractiveWordDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);

  const words = [
    { tahitian: "Ia ora na", french: "Bonjour", english: "Hello", audio: "🔊" },
    { tahitian: "Māuruuru", french: "Merci", english: "Thank you", audio: "🔊" },
    { tahitian: "Nana", french: "Au revoir", english: "Goodbye", audio: "🔊" },
    { tahitian: "E aha te huru?", french: "Comment ça va?", english: "How are you?", audio: "🔊" },
  ];

  const playWord = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 1500);
  };

  return (
    <div className="glass-panel p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Mic className="w-5 h-5 text-[var(--tahiti-coral)]" />
          <span className="text-sm font-medium text-[var(--tahiti-platinum)]">Try It Now</span>
        </div>
        <h3 className="text-2xl font-bold text-[var(--tahiti-pearl)]">Learn Your First Word</h3>
      </div>

      <div className="relative bg-[var(--tahiti-deep)] rounded-2xl p-6 mb-4">
        {/* Tahitian Word */}
        <div className="text-center mb-4">
          <p className="text-4xl font-bold bg-gradient-to-r from-[var(--tahiti-aqua)] to-[var(--tahiti-cyan)] bg-clip-text text-transparent">
            {words[currentWord].tahitian}
          </p>
        </div>

        {/* Translations */}
        <div className="flex justify-center gap-8 text-center">
          <div>
            <p className="text-xs text-[var(--tahiti-platinum)] mb-1">French</p>
            <p className="text-lg text-[var(--tahiti-silver)]">{words[currentWord].french}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--tahiti-platinum)] mb-1">English</p>
            <p className="text-lg text-[var(--tahiti-silver)]">{words[currentWord].english}</p>
          </div>
        </div>

        {/* Audio Button */}
        <button
          onClick={playWord}
          className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying
            ? 'bg-[var(--tahiti-aqua)] scale-110'
            : 'bg-[var(--tahiti-lagoon)] hover:bg-[var(--tahiti-aqua)]'
            }`}
        >
          <Volume2 className={`w-5 h-5 ${isPlaying ? 'text-[var(--tahiti-deep)]' : 'text-[var(--tahiti-aqua)]'}`} />
        </button>
      </div>

      {/* Word Navigation */}
      <div className="flex justify-center gap-2">
        {words.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentWord(i)}
            className={`w-3 h-3 rounded-full transition-all ${i === currentWord
              ? 'bg-[var(--tahiti-aqua)] w-6'
              : 'bg-[var(--tahiti-lagoon)] hover:bg-[var(--tahiti-turquoise)]'
              }`}
          />
        ))}
      </div>
    </div>
  );
}

// Testimonial Carousel Component
function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  const testimonials = [
    {
      name: "Marie Dupont",
      role: "French Teacher, Paris",
      text: "TahitiSpeak has transformed how I teach Polynesian culture. My students love the interactive lessons!",
      avatar: "👩‍🏫",
      rating: 5
    },
    {
      name: "Jean-Pierre Moana",
      role: "Tahitian Native, Papeete",
      text: "Finally, a platform that truly captures the essence of our beautiful language. Māuruuru roa!",
      avatar: "🧑‍🎓",
      rating: 5
    },
    {
      name: "Sophie Martin",
      role: "Travel Blogger",
      text: "I learned basic Tahitian before my trip and the locals were so happy! This app made it easy.",
      avatar: "✈️",
      rating: 5
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="glass-panel p-8 text-center">
        {/* Stars */}
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(testimonials[current].rating)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-[var(--tahiti-gold)] text-[var(--tahiti-gold)]" />
          ))}
        </div>

        {/* Quote */}
        <p className="text-xl text-[var(--tahiti-pearl)] mb-6 italic">
          "{testimonials[current].text}"
        </p>

        {/* Author */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl">{testimonials[current].avatar}</span>
          <div className="text-left">
            <p className="font-bold text-[var(--tahiti-pearl)]">{testimonials[current].name}</p>
            <p className="text-sm text-[var(--tahiti-platinum)]">{testimonials[current].role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrent(prev => (prev - 1 + testimonials.length) % testimonials.length)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 w-10 h-10 rounded-full bg-[var(--tahiti-lagoon)] flex items-center justify-center hover:bg-[var(--tahiti-aqua)] transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-[var(--tahiti-pearl)]" />
      </button>
      <button
        onClick={() => setCurrent(prev => (prev + 1) % testimonials.length)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 w-10 h-10 rounded-full bg-[var(--tahiti-lagoon)] flex items-center justify-center hover:bg-[var(--tahiti-aqua)] transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-[var(--tahiti-pearl)]" />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current
              ? 'bg-[var(--tahiti-aqua)] w-6'
              : 'bg-[var(--tahiti-lagoon)]'
              }`}
          />
        ))}
      </div>
    </div>
  );
}

// Gamification Stats Component
function GamificationStats() {
  const [animatedStats, setAnimatedStats] = useState({ lessons: 0, words: 0, streak: 0 });

  useEffect(() => {
    const targets = { lessons: 50, words: 1200, streak: 30 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedStats({
        lessons: Math.floor(targets.lessons * progress),
        words: Math.floor(targets.words * progress),
        streak: Math.floor(targets.streak * progress)
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="glass-panel p-6 text-center group hover:border-[var(--tahiti-aqua)] transition-colors">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--tahiti-aqua)] to-[var(--tahiti-turquoise)] flex items-center justify-center group-hover:scale-110 transition-transform">
          <BookOpen className="w-8 h-8 text-[var(--tahiti-deep)]" />
        </div>
        <p className="text-4xl font-bold text-[var(--tahiti-aqua)]">{animatedStats.lessons}+</p>
        <p className="text-[var(--tahiti-platinum)]">Interactive Lessons</p>
      </div>

      <div className="glass-panel p-6 text-center group hover:border-[var(--tahiti-turquoise)] transition-colors">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--tahiti-turquoise)] to-[var(--tahiti-cyan)] flex items-center justify-center group-hover:scale-110 transition-transform">
          <MessageCircle className="w-8 h-8 text-[var(--tahiti-deep)]" />
        </div>
        <p className="text-4xl font-bold text-[var(--tahiti-turquoise)]">{animatedStats.words}+</p>
        <p className="text-[var(--tahiti-platinum)]">Vocabulary Words</p>
      </div>

      <div className="glass-panel p-6 text-center group hover:border-[var(--tahiti-coral)] transition-colors">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--tahiti-coral)] to-[var(--tahiti-hibiscus)] flex items-center justify-center group-hover:scale-110 transition-transform">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <p className="text-4xl font-bold text-[var(--tahiti-coral)]">{animatedStats.streak}</p>
        <p className="text-[var(--tahiti-platinum)]">Day Streak Record</p>
      </div>
    </div>
  );
}

// Learning Path Preview Component
function LearningPathPreview() {
  const steps = [
    { title: "Basics", icon: Target, complete: true },
    { title: "Greetings", icon: MessageCircle, complete: true },
    { title: "Family", icon: Users, complete: false, current: true },
    { title: "Numbers", icon: BookOpen, complete: false },
    { title: "Culture", icon: Music, complete: false },
    { title: "Master", icon: Trophy, complete: false },
  ];

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={i} className="relative flex flex-col items-center">
            {/* Connector Line */}
            {i < steps.length - 1 && (
              <div
                className={`absolute top-8 left-[60%] w-full h-1 ${step.complete ? 'bg-[var(--tahiti-aqua)]' : 'bg-[var(--tahiti-lagoon)]'
                  }`}
                style={{ width: 'calc(100% + 40px)' }}
              />
            )}

            {/* Node */}
            <div
              className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${step.complete
                ? 'bg-gradient-to-br from-[var(--tahiti-aqua)] to-[var(--tahiti-turquoise)]'
                : step.current
                  ? 'bg-[var(--tahiti-lagoon)] border-2 border-[var(--tahiti-aqua)] animate-pulse'
                  : 'bg-[var(--tahiti-lagoon)]'
                }`}
            >
              <step.icon className={`w-7 h-7 ${step.complete ? 'text-[var(--tahiti-deep)]' : 'text-[var(--tahiti-platinum)]'}`} />
            </div>

            {/* Label */}
            <p className={`mt-3 text-sm font-medium ${step.complete || step.current ? 'text-[var(--tahiti-pearl)]' : 'text-[var(--tahiti-platinum)]'
              }`}>
              {step.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const featuredLessons = [
    {
      id: 'greetings-basics',
      title: 'Basic Greetings',
      description: 'Learn essential Tahitian greetings and polite expressions',
      level: 'Beginner',
      duration: '15 min',
      image: '/images/tahiti/lei-welcome.png',
      tags: ['greetings', 'basics']
    },
    {
      id: 'family-members',
      title: 'Family Members',
      description: 'Vocabulary for family relationships and kinship terms',
      level: 'Beginner',
      duration: '20 min',
      image: '/images/tahiti/dancers.png',
      tags: ['family', 'vocabulary']
    },
    {
      id: 'numbers-counting',
      title: 'Numbers & Counting',
      description: 'Learn to count and use numbers in everyday situations',
      level: 'Beginner',
      duration: '18 min',
      image: '/images/tahiti/beach.png',
      tags: ['numbers', 'basics']
    }
  ];

  const cultureHighlights = [
    {
      title: 'Traditional Dance',
      description: 'Experience the rhythm of Tahitian Ori Tahiti',
      image: '/images/tahiti/dancers.png'
    },
    {
      title: 'Island Welcome',
      description: 'Learn the art of warm Polynesian hospitality',
      image: '/images/tahiti/lei-welcome.png'
    },
    {
      title: 'Paradise Beaches',
      description: 'Discover the beauty of Tahitian landscapes',
      image: '/images/tahiti/beach.png'
    }
  ];

  const typewriterPhrases = [
    "Ia ora na! 🌺",
    "Welcome to Paradise",
    "Learn Tahitian Today",
    "Māuruuru roa!",
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen">
        {/* Hero Section with Animated Typography */}
        <section className="hero-tahiti relative" aria-labelledby="hero-heading">
          <div
            className="hero-background"
            style={{ backgroundImage: 'url(/images/tahiti/hero-banner.png)' }}
          />
          <FloatingParticles />

          <div className="hero-content relative z-10">
            {/* Animated Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[rgba(0,212,170,0.2)] to-[rgba(0,180,216,0.2)] border border-[rgba(0,212,170,0.3)] animate-pulse">
                <Sparkles className="w-4 h-4 text-[var(--tahiti-aqua)]" />
                <TypewriterText phrases={typewriterPhrases} className="text-sm font-medium text-[var(--tahiti-cyan)]" />
              </div>
            </div>

            <h1 id="hero-heading" className="hero-title">
              Master Tahitian Through
              <br />
              <span className="relative inline-block">
                Cultural Immersion
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 2 150 2 298 10" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="underline-gradient" x1="0" y1="0" x2="300" y2="0">
                      <stop offset="0%" stopColor="var(--tahiti-aqua)" />
                      <stop offset="100%" stopColor="var(--tahiti-turquoise)" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="hero-subtitle">
              Discover the beauty of Reo Tahiti through interactive lessons,
              authentic cultural experiences, and the warmth of Polynesian traditions.
            </p>

            {/* CTA Buttons with Micro-interactions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center" role="group">
              <Link href="/lessons">
                <button className="btn-glow btn-glow-primary btn-pulse flex items-center gap-3 group">
                  <Play className="w-5 h-5 group-hover:scale-125 transition-transform" />
                  Start Learning Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/lessons">
                <button className="btn-glow flex items-center gap-3 group">
                  <Headphones className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Listen to Tahitian
                </button>
              </Link>
            </div>
          </div>

          <div className="wave-decoration" />
        </section>

        {/* Interactive Word Demo Section */}
        <section className="py-24 px-4 relative" style={{ background: 'var(--tahiti-deep)' }}>
          <FloatingParticles />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--tahiti-pearl)' }}>
                Try Your First <span style={{ color: 'var(--tahiti-aqua)' }}>Tahitian Phrase</span>
              </h2>
              <p className="text-lg" style={{ color: 'var(--tahiti-platinum)' }}>
                Click to hear authentic pronunciation
              </p>
            </div>

            <InteractiveWordDemo />
          </div>
        </section>

        {/* Gamification Stats Section */}
        <section className="py-24 px-4" style={{ background: 'var(--tahiti-ocean)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--tahiti-pearl)' }}>
                Join Thousands of <span style={{ color: 'var(--tahiti-coral)' }}>Happy Learners</span>
              </h2>
            </div>

            <GamificationStats />
          </div>
        </section>

        {/* Learning Path Preview */}
        <section className="py-24 px-4" style={{ background: 'var(--tahiti-deep)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--tahiti-pearl)' }}>
                Your Learning <span style={{ color: 'var(--tahiti-aqua)' }}>Journey</span>
              </h2>
              <p className="text-lg" style={{ color: 'var(--tahiti-platinum)' }}>
                Progress through structured lessons from beginner to fluent
              </p>
            </div>

            <LearningPathPreview />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 relative" style={{ background: 'var(--tahiti-ocean)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--tahiti-pearl)' }}>
                Why Learn <span style={{ color: 'var(--tahiti-aqua)' }}>Tahitian</span>?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="feature-card group">
                <div className="feature-icon">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="feature-title">Interactive Lessons</h3>
                <p className="feature-description">
                  Engaging content with audio pronunciation and real-world cultural context.
                </p>
              </div>

              <div className="feature-card group">
                <div className="feature-icon">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="feature-title">Cultural Immersion</h3>
                <p className="feature-description">
                  Learn through Polynesian traditions, songs, and stories.
                </p>
              </div>

              <div className="feature-card group">
                <div className="feature-icon">
                  <Award className="w-7 h-7" />
                </div>
                <h3 className="feature-title">Gamified Progress</h3>
                <p className="feature-description">
                  Earn achievements, maintain streaks, and track your journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cultural Highlights Section */}
        <section className="py-24 px-4" style={{ background: 'var(--tahiti-deep)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--tahiti-pearl)' }}>
                Experience <span style={{ color: 'var(--tahiti-coral)' }}>Tahitian Culture</span>
              </h2>
            </div>

            <div className="culture-grid">
              {cultureHighlights.map((item, index) => (
                <div key={index} className="culture-card">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <div className="culture-content">
                    <h3 className="culture-title">{item.title}</h3>
                    <p className="culture-description">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 px-4" style={{ background: 'var(--tahiti-ocean)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--tahiti-pearl)' }}>
                What Learners <span style={{ color: 'var(--tahiti-gold)' }}>Say</span>
              </h2>
            </div>

            <TestimonialCarousel />
          </div>
        </section>

        {/* Featured Lessons */}
        <section className="py-24 px-4" style={{ background: 'var(--tahiti-deep)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--tahiti-pearl)' }}>
                Featured <span style={{ color: 'var(--tahiti-aqua)' }}>Lessons</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredLessons.map((lesson) => (
                <div key={lesson.id} className="lesson-card group">
                  <div className="lesson-image">
                    <Image
                      src={lesson.image}
                      alt={lesson.title}
                      fill
                      className="object-cover"
                    />
                    <span className="lesson-badge">{lesson.level}</span>
                  </div>

                  <div className="lesson-content">
                    <h3 className="lesson-title">{lesson.title}</h3>
                    <p className="mb-4" style={{ color: 'var(--tahiti-platinum)' }}>{lesson.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {lesson.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs font-medium rounded-full"
                          style={{
                            background: 'rgba(0, 212, 170, 0.15)',
                            color: 'var(--tahiti-aqua)'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="lesson-meta mb-4">
                      <span>⏱️ {lesson.duration}</span>
                    </div>

                    <Link href={`/lessons/${lesson.id}`}>
                      <button className="btn-glow w-full flex items-center justify-center gap-2">
                        Start Lesson
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/lessons">
                <button className="btn-glow btn-glow-primary px-12">
                  View All Lessons
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(/images/tahiti/beach.png)',
              filter: 'brightness(0.2)'
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(10, 22, 40, 0.95) 100%)' }}
          />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--tahiti-aqua)] to-[var(--tahiti-turquoise)] flex items-center justify-center">
                <Trophy className="w-10 h-10 text-[var(--tahiti-deep)]" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--tahiti-pearl)' }}>
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl mb-8" style={{ color: 'var(--tahiti-silver)' }}>
              Join thousands of learners discovering the beauty of Tahitian.
            </p>
            <Link href="/auth/register">
              <button className="btn-glow btn-glow-coral btn-pulse px-12 py-5 text-lg">
                Get Started Free — No Credit Card Required
              </button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer-tahiti" role="contentinfo">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, var(--tahiti-aqua), var(--tahiti-turquoise))' }}
                  >
                    <BookOpen className="w-5 h-5" style={{ color: 'var(--tahiti-deep)' }} />
                  </div>
                  <span className="text-xl font-bold" style={{ color: 'var(--tahiti-pearl)' }}>TahitiSpeak</span>
                </div>
                <p style={{ color: 'var(--tahiti-platinum)' }} className="max-w-sm">
                  Learn the beautiful Tahitian language through immersive cultural experiences.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--tahiti-pearl)' }}>Learn</h3>
                <ul className="space-y-2">
                  <li><Link href="/lessons" className="footer-link hover:text-[var(--tahiti-aqua)]">All Lessons</Link></li>
                  <li><Link href="/vocabulary" className="footer-link hover:text-[var(--tahiti-aqua)]">Vocabulary</Link></li>
                  <li><Link href="/culture" className="footer-link hover:text-[var(--tahiti-aqua)]">Culture</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--tahiti-pearl)' }}>Support</h3>
                <ul className="space-y-2">
                  <li><Link href="/help" className="footer-link hover:text-[var(--tahiti-aqua)]">Help Center</Link></li>
                  <li><Link href="/about" className="footer-link hover:text-[var(--tahiti-aqua)]">About</Link></li>
                  <li><Link href="/contact" className="footer-link hover:text-[var(--tahiti-aqua)]">Contact</Link></li>
                </ul>
              </div>
            </div>

            <div
              className="border-t pt-8 text-center"
              style={{ borderColor: 'rgba(0, 212, 170, 0.1)', color: 'var(--tahiti-platinum)' }}
            >
              <p>&copy; 2024 TahitiSpeak. Mauruuru roa 🌺</p>
            </div>
          </div>
        </footer>
      </div>
    </PublicLayout>
  );
}
