'use client';

import { useState, useEffect } from 'react';
import { LocalDataService } from '@/lib/data/DataService';
import type { Course, AdminDashboardStats, AdminActivityLog } from '@/types';

const dataService = new LocalDataService();

export function useAdminService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsync = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Admin service error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    return handleAsync(() => dataService.createCourse(courseData));
  };

  const updateCourse = async (id: number, updates: Partial<Course>) => {
    return handleAsync(() => dataService.updateCourse(id, updates));
  };

  const deleteCourse = async (id: number) => {
    return handleAsync(() => dataService.deleteCourse(id));
  };

  const getCourses = async (filters?: { level?: string; category?: string; status?: string }) => {
    return handleAsync(() => dataService.getCourses(filters));
  };

  const getCourse = async (id: number) => {
    return handleAsync(() => dataService.getCourse(id));
  };

  const bulkImportCourses = async (courses: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    return handleAsync(() => dataService.bulkImportCourses(courses));
  };

  const searchCourses = async (query: string) => {
    return handleAsync(() => dataService.searchCourses(query));
  };

  const getAdminStats = async () => {
    return handleAsync(() => dataService.getAdminStats());
  };

  const getActivityLogs = async (limit?: number) => {
    return handleAsync(() => dataService.getActivityLogs(limit));
  };

  const createCourseVersion = async (courseId: number, version: number) => {
    return handleAsync(() => dataService.createCourseVersion(courseId, version));
  };

  const restoreCourseVersion = async (courseId: number, version: number) => {
    return handleAsync(() => dataService.restoreCourseVersion(courseId, version));
  };

  const uploadMedia = async (file: File, type: 'audio' | 'image' | 'video') => {
    return handleAsync(async () => {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a mock URL for the uploaded file
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const filename = `${type}_${timestamp}.${extension}`;
      
      return `/media/${type}s/${filename}`;
    });
  };

  const clearError = () => setError(null);

  return {
    // State
    isLoading,
    error,
    
    // Course management
    createCourse,
    updateCourse,
    deleteCourse,
    getCourses,
    getCourse,
    bulkImportCourses,
    searchCourses,
    
    // Admin dashboard
    getAdminStats,
    getActivityLogs,
    
    // Versioning
    createCourseVersion,
    restoreCourseVersion,
    
    // Media
    uploadMedia,
    
    // Utilities
    clearError
  };
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        const adminStats = await dataService.getAdminStats();
        setStats(adminStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const refreshStats = async () => {
    try {
      setIsLoading(true);
      const adminStats = await dataService.getAdminStats();
      setStats(adminStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stats');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    isLoading,
    error,
    refreshStats
  };
}

export function useCourses(filters?: { level?: string; category?: string; status?: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        const courseList = await dataService.getCourses(filters);
        setCourses(courseList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, [filters?.level, filters?.category, filters?.status]);

  const refreshCourses = async () => {
    try {
      setIsLoading(true);
      const courseList = await dataService.getCourses(filters);
      setCourses(courseList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh courses');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    courses,
    isLoading,
    error,
    refreshCourses
  };
}

export function useActivityLogs(limit: number = 20) {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const activityLogs = await dataService.getActivityLogs(limit);
        setLogs(activityLogs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activity logs');
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, [limit]);

  const refreshLogs = async () => {
    try {
      setIsLoading(true);
      const activityLogs = await dataService.getActivityLogs(limit);
      setLogs(activityLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh logs');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logs,
    isLoading,
    error,
    refreshLogs
  };
}