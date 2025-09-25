import React from 'react';
import { notFound } from 'next/navigation';
import { JSONDataService } from '@/lib/data/JSONDataService';
import { LessonPageClient } from './LessonPageClient';
import type { Lesson } from '@/types';

interface LessonPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all lessons
export async function generateStaticParams() {
  try {
    const dataService = new JSONDataService();
    const lessons = await dataService.getAllLessons();
    
    return lessons.map((lesson) => ({
      slug: lesson.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Generate metadata for each lesson
export async function generateMetadata({ params }: LessonPageProps) {
  try {
    const { slug } = await params;
    const dataService = new JSONDataService();
    const lesson = await dataService.getLessonBySlug(slug);
    
    if (!lesson) {
      return {
        title: 'Lesson Not Found',
        description: 'The requested lesson could not be found.'
      };
    }
    
    return {
      title: `${lesson.title.french} - Tahitian French Tutor`,
      description: lesson.summary,
      keywords: lesson.tags?.join(', '),
      openGraph: {
        title: lesson.title.french,
        description: lesson.summary,
        type: 'article',
        locale: 'fr_FR',
        alternateLocale: 'ty_PF'
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Lesson - Tahitian French Tutor',
      description: 'Learn Tahitian through interactive lessons'
    };
  }
}

export default async function LessonPageRoute({ params }: LessonPageProps) {
  try {
    const { slug } = await params;
    const dataService = new JSONDataService();
    const lesson = await dataService.getLessonBySlug(slug);
    
    if (!lesson) {
      notFound();
    }
    
    return (
      <LessonPageClient lesson={lesson} />
    );
  } catch (error) {
    console.error('Error loading lesson:', error);
    notFound();
  }
}



// Enable static generation
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour