import { http, HttpResponse } from 'msw';

// Mock user data
const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'student',
  preferences: {
    language: 'en',
    theme: 'light'
  }
};

// Mock course data
const mockCourses = [
  {
    id: '1',
    title: 'Basic Tahitian',
    description: 'Learn basic Tahitian phrases',
    level: 'beginner',
    lessons: 10,
    progress: 0
  },
  {
    id: '2',
    title: 'Intermediate Tahitian',
    description: 'Expand your Tahitian vocabulary',
    level: 'intermediate',
    lessons: 15,
    progress: 0
  }
];

// Mock lesson data
const mockLessons = [
  {
    id: '1',
    courseId: '1',
    title: 'Greetings',
    content: 'Learn basic greetings in Tahitian',
    type: 'vocabulary',
    order: 1
  },
  {
    id: '2',
    courseId: '1',
    title: 'Numbers',
    content: 'Learn numbers 1-10 in Tahitian',
    type: 'vocabulary',
    order: 2
  }
];

export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };
    
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        user: mockUser,
        token: 'mock-jwt-token',
        success: true
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const userData = await request.json() as Record<string, any>;
    return HttpResponse.json({
      user: { ...mockUser, ...(userData || {}) },
      token: 'mock-jwt-token',
      success: true
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader && authHeader.includes('mock-jwt-token')) {
      return HttpResponse.json({ user: mockUser });
    }
    
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }),

  // Course endpoints
  http.get('/api/courses', () => {
    return HttpResponse.json({ courses: mockCourses });
  }),

  http.get('/api/courses/:id', ({ params }) => {
    const course = mockCourses.find(c => c.id === params.id);
    
    if (course) {
      return HttpResponse.json({ course });
    }
    
    return HttpResponse.json(
      { error: 'Course not found' },
      { status: 404 }
    );
  }),

  http.post('/api/courses', async ({ request }) => {
    const courseData = await request.json() as Record<string, any>;
    const newCourse = {
      id: String(mockCourses.length + 1),
      ...(courseData || {}),
      lessons: 0,
      progress: 0
    };
    
    return HttpResponse.json({ course: newCourse }, { status: 201 });
  }),

  // Lesson endpoints
  http.get('/api/courses/:courseId/lessons', ({ params }) => {
    const lessons = mockLessons.filter(l => l.courseId === params.courseId);
    return HttpResponse.json({ lessons });
  }),

  http.get('/api/lessons/:id', ({ params }) => {
    const lesson = mockLessons.find(l => l.id === params.id);
    
    if (lesson) {
      return HttpResponse.json({ lesson });
    }
    
    return HttpResponse.json(
      { error: 'Lesson not found' },
      { status: 404 }
    );
  }),

  // Progress endpoints
  http.post('/api/progress', async ({ request }) => {
    const progressData = await request.json() as Record<string, any>;
    return HttpResponse.json({
      progress: {
        id: '1',
        ...(progressData || {}),
        timestamp: new Date().toISOString()
      }
    });
  }),

  http.get('/api/progress/:userId', ({ params }) => {
    return HttpResponse.json({
      progress: {
        userId: params.userId,
        coursesCompleted: 2,
        lessonsCompleted: 15,
        totalStudyTime: 3600,
        streak: 7
      }
    });
  }),

  // Admin endpoints
  http.get('/api/admin/users', () => {
    return HttpResponse.json({
      users: [
        mockUser,
        {
          id: '2',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        }
      ]
    });
  }),

  http.get('/api/admin/analytics', () => {
    return HttpResponse.json({
      analytics: {
        totalUsers: 150,
        activeUsers: 45,
        coursesCreated: 12,
        lessonsCompleted: 1250
      }
    });
  }),

  // Translation endpoints
  http.post('/api/translate', async ({ request }) => {
    const { text, from, to } = await request.json() as {
      text: string;
      from: string;
      to: string;
    };
    
    // Mock translation response
    const translations: Record<string, Record<string, string>> = {
      'Hello': {
        'ty': 'Ia ora na',
        'fr': 'Bonjour'
      },
      'Thank you': {
        'ty': 'Mauruuru',
        'fr': 'Merci'
      }
    };
    
    const translated = translations[text]?.[to] || `[${to}] ${text}`;
    
    return HttpResponse.json({
      translatedText: translated,
      confidence: 0.95
    });
  })
];