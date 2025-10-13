'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, BookOpen, User, Settings, LogOut, Scroll } from 'lucide-react';

export const TropicalNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-gradient-to-r from-tropical-ocean to-tropical-lagoon shadow-2xl relative z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-tropical-coral to-tropical-sunset rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-xl">🌺</span>
            </div>
            <span className="font-tropical-heading text-2xl text-white font-bold">
              Tahiti Speaks
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/lessons" 
              className="text-tropical-sand hover:text-white transition-colors duration-300 font-medium flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Lessons
            </Link>
            <Link 
              href="/stories" 
              className="text-tropical-sand hover:text-white transition-colors duration-300 font-medium flex items-center gap-2"
            >
              <Scroll className="w-4 h-4" />
              Stories
            </Link>
            <Link 
              href="/culture" 
              className="text-tropical-sand hover:text-white transition-colors duration-300 font-medium"
            >
              Culture
            </Link>
            <Link 
              href="/progress" 
              className="text-tropical-sand hover:text-white transition-colors duration-300 font-medium"
            >
              Progress
            </Link>
            <Link 
              href="/community" 
              className="text-tropical-sand hover:text-white transition-colors duration-300 font-medium"
            >
              Community
            </Link>
            
            {/* User Menu */}
            <div className="flex items-center gap-4">
              <Link 
                href="/profile" 
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
              >
                <User className="w-5 h-5 text-white" />
              </Link>
              <button className="bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-tropical-ocean/95 backdrop-blur-sm border-t border-white/20">
            <div className="px-6 py-6 space-y-4">
              <Link 
                href="/lessons" 
                className="block text-tropical-sand hover:text-white transition-colors duration-300 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Lessons
              </Link>
              <Link 
                href="/stories" 
                className="block text-tropical-sand hover:text-white transition-colors duration-300 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Stories
              </Link>
              <Link 
                href="/culture" 
                className="block text-tropical-sand hover:text-white transition-colors duration-300 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Culture
              </Link>
              <Link 
                href="/progress" 
                className="block text-tropical-sand hover:text-white transition-colors duration-300 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Progress
              </Link>
              <Link 
                href="/community" 
                className="block text-tropical-sand hover:text-white transition-colors duration-300 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Community
              </Link>
              <div className="border-t border-white/20 pt-4 mt-4">
                <Link 
                  href="/profile" 
                  className="block text-tropical-sand hover:text-white transition-colors duration-300 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button className="w-full bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white px-6 py-3 rounded-xl font-semibold mt-4 hover:shadow-lg transition-all duration-300">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};