'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';
import { authBridge } from '@/lib/auth/AuthBridge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  BookOpen,
  Users,
  BarChart3,
  Shield,
  Home,
  GraduationCap,
  Globe,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const { hasRole } = useAuthorization();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted state on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect - only after mounted
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    // Check initial scroll position
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);


  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const navigationItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      show: true,
    },
    {
      name: 'Lessons',
      href: '/lessons',
      icon: BookOpen,
      show: true,
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      show: isAuthenticated,
    },
    {
      name: 'Community',
      href: '/community',
      icon: Users,
      show: isAuthenticated,
    },
    {
      name: 'Admin',
      href: '/admin/dashboard',
      icon: Shield,
      show: isAuthenticated && hasRole('admin') && authBridge.hasAdminAccess(),
    },
    {
      name: 'Instructor',
      href: '/instructor',
      icon: GraduationCap,
      show: isAuthenticated && (hasRole('admin') || hasRole('instructor')),
    },
  ];

  const visibleItems = navigationItems.filter(item => item.show);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'py-2'
        : 'py-3'
        }`}
      style={{
        background: scrolled
          ? 'rgba(10, 22, 40, 0.98)'
          : 'rgba(10, 22, 40, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 212, 170, 0.1)',
        boxShadow: scrolled ? '0 0 30px rgba(0, 0, 0, 0.3)' : 'none'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, var(--tahiti-aqua), var(--tahiti-turquoise))',
                boxShadow: '0 0 20px rgba(0, 212, 170, 0.3)'
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'var(--tahiti-deep)' }} />
            </div>
            <div className="flex flex-col">
              <span
                className="text-xl font-bold tracking-tight"
                style={{ color: 'var(--tahiti-pearl)' }}
              >
                TahitiSpeak
              </span>
              <span
                className="text-xs hidden sm:block"
                style={{ color: 'var(--tahiti-platinum)' }}
              >
                Learn Tahitian Today
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="nav-link flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                  style={{ color: 'var(--tahiti-silver)' }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Auth & Language */}
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-300 hover:bg-[rgba(0,212,170,0.1)]"
              style={{
                border: '1px solid rgba(0, 212, 170, 0.2)',
              }}
            >
              <Globe className="w-4 h-4" style={{ color: 'var(--tahiti-aqua)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--tahiti-silver)' }}>EN</span>
            </div>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative h-10 w-10 rounded-full overflow-hidden transition-all duration-300 hover:scale-105"
                    style={{
                      border: '2px solid var(--tahiti-aqua)',
                      boxShadow: '0 0 15px rgba(0, 212, 170, 0.3)'
                    }}
                  >
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                      <AvatarFallback
                        style={{
                          background: 'linear-gradient(135deg, var(--tahiti-aqua), var(--tahiti-turquoise))',
                          color: 'var(--tahiti-deep)'
                        }}
                      >
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  forceMount
                  style={{
                    background: 'var(--tahiti-ocean)',
                    border: '1px solid rgba(0, 212, 170, 0.2)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--tahiti-pearl)' }}>{user?.name}</p>
                      <p className="text-xs" style={{ color: 'var(--tahiti-platinum)' }}>
                        {user?.email}
                      </p>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 w-fit"
                        style={{
                          background: 'rgba(0, 212, 170, 0.2)',
                          color: 'var(--tahiti-aqua)'
                        }}
                      >
                        {user?.role}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator style={{ background: 'rgba(0, 212, 170, 0.1)' }} />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer" style={{ color: 'var(--tahiti-silver)' }}>
                      <User className="mr-2 h-4 w-4" style={{ color: 'var(--tahiti-aqua)' }} />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer" style={{ color: 'var(--tahiti-silver)' }}>
                      <Settings className="mr-2 h-4 w-4" style={{ color: 'var(--tahiti-aqua)' }} />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ background: 'rgba(0, 212, 170, 0.1)' }} />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                    style={{ color: 'var(--tahiti-coral)' }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <button
                    className="relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 overflow-hidden group"
                    style={{
                      color: 'var(--tahiti-pearl)',
                      border: '1px solid rgba(0, 212, 170, 0.4)',
                      background: 'rgba(0, 212, 170, 0.05)'
                    }}
                  >
                    <span className="relative z-10">Sign In</span>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15), rgba(0, 180, 216, 0.15))'
                      }}
                    />
                  </button>
                </Link>
                <Link href="/auth/register">
                  <button
                    className="relative px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 overflow-hidden group"
                    style={{
                      color: 'var(--tahiti-deep)',
                      background: 'linear-gradient(135deg, #00d4aa, #00b4d8)',
                      boxShadow: '0 0 20px rgba(0, 212, 170, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #00e5b8, #00c8e8)'
                      }}
                    />
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg transition-all duration-300 hover:bg-[rgba(0,212,170,0.1)]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ color: 'var(--tahiti-pearl)' }}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden mt-4 pb-4 border-t"
            style={{ borderColor: 'rgba(0, 212, 170, 0.1)' }}
          >
            <div className="pt-4 space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300"
                    style={{ color: 'var(--tahiti-silver)' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0, 212, 170, 0.1)' }}
                    >
                      <Icon className="h-5 w-5" style={{ color: 'var(--tahiti-aqua)' }} />
                    </div>
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Language Selector */}
              <div
                className="flex items-center space-x-3 px-4 py-3 rounded-xl"
                style={{ color: 'var(--tahiti-silver)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0, 212, 170, 0.1)' }}
                >
                  <Globe className="h-5 w-5" style={{ color: 'var(--tahiti-aqua)' }} />
                </div>
                <span>Language: English</span>
              </div>

              {!isAuthenticated && (
                <div className="pt-4 mt-4 border-t space-y-3" style={{ borderColor: 'rgba(0, 212, 170, 0.1)' }}>
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button
                      className="w-full px-4 py-3 text-center font-medium rounded-xl transition-all duration-300"
                      style={{
                        color: 'var(--tahiti-silver)',
                        border: '1px solid rgba(0, 212, 170, 0.2)'
                      }}
                    >
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="btn-glow btn-glow-primary w-full py-3 text-center font-semibold">
                      Get Started Free
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}