'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';
import { authBridge } from '@/lib/auth/AuthBridge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/Badge';
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
  Scroll,
} from 'lucide-react';
import { toast } from 'sonner';
import { LanguageSwitcher } from '../LanguageSwitcher';

export function Navigation() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { hasRole } = useAuthorization();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by only showing auth-dependent content after client mount
  useEffect(() => {
    setIsClient(true);
  }, []);

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
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      show: isClient && isAuthenticated,
    },
    {
      name: 'Lessons',
      href: '/lessons',
      icon: BookOpen,
      show: isClient && isAuthenticated,
    },
    {
      name: 'Stories',
      href: '/stories',
      icon: Scroll,
      show: isClient && isAuthenticated,
      className: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700',
    },
    {
      name: '🌺 Tropical',
      href: '/lessons/tropical',
      icon: BookOpen,
      show: isClient && isAuthenticated,
      className: 'bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white hover:from-tropical-sunset hover:to-tropical-coral',
    },
    {
      name: 'Community',
      href: '/community',
      icon: Users,
      show: isClient && isAuthenticated,
    },
    {
      name: 'Admin',
      href: '/admin/dashboard',
      icon: Shield,
      show: isClient && isAuthenticated && hasRole('admin') && authBridge.hasAdminAccess(),
    },
    {
      name: 'Instructor',
      href: '/instructor',
      icon: GraduationCap,
      show: isClient && isAuthenticated && (hasRole('admin') || hasRole('instructor')),
    },
  ];

  const visibleItems = navigationItems.filter(item => item.show);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Tahitian Tutor</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const baseClassName = "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors";
              const defaultClassName = "text-gray-700 hover:text-gray-900 hover:bg-gray-100";
              const className = item.className ? `${baseClassName} ${item.className}` : `${baseClassName} ${defaultClassName}`;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={className}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Language Switcher and User Menu */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher variant="compact" />
            {isClient && isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar_url} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {user?.role}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isClient ? (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-16 h-8"></div>
                <div className="w-16 h-8"></div>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const baseMobileClassName = "flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors";
                const defaultMobileClassName = "text-gray-700 hover:text-gray-900 hover:bg-gray-100";
                const mobileClassName = item.className ? `${baseMobileClassName} ${item.className}` : `${baseMobileClassName} ${defaultMobileClassName}`;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={mobileClassName}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              
              {/* Mobile Language Switcher */}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="px-3 py-2">
                  <LanguageSwitcher variant="inline" />
                </div>
              </div>
              
              {isClient && !isAuthenticated && (
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex flex-col space-y-2">
                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}