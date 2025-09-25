import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../api/server';
import { DatabaseService } from '../../api/services/DatabaseService';
import { createTestUser, loginTestUser, deleteTestUser } from './auth.test';
import { logger } from '../../src/services/LoggingService';

// Test data
const TEST_INSTRUCTOR = {
  email: 'instructor@example.com',
  password: 'InstructorPass123!',
  firstName: 'Test',
  lastName: 'Instructor',
  role: 'instructor'
};

const TEST_STUDENT = {
  email: 'student@example.com',
  password: 'StudentPass123!',
  firstName: 'Test',
  lastName: 'Student',
  role: 'student'
};

const TEST_COURSE = {
  title: 'Introduction to Tahitian',
  description: 'Learn the basics of Tahitian language and culture',
  level: 'beginner',
  category: 'language',
  duration: 120, // minutes
  price: 29.99,
  isPublished: true,
  tags: ['tahitian', 'polynesian', 'beginner'],
  objectives: [
    'Learn basic Tahitian greetings',
    'Understand Tahitian pronunciation',
    'Practice common phrases'
  ]
};

const TEST_LESSON = {
  title: 'Basic Greetings',
  description: 'Learn how to greet people in Tahitian',
  content: 'In this lesson, we will learn basic Tahitian greetings...',
  type: 'video',
  duration: 15,
  order: 1,
  isPublished: true,
  resources: [
    {
      type: 'video',
      url: 'https://example.com/video1.mp4',
      title: 'Greetings Video'
    },
    {
      type: 'audio',
      url: 'https://example.com/audio1.mp3',
      title: 'Pronunciation Guide'
    }
  ]
};

let instructorToken: string;
let studentToken: string;
let instructorId: string;
let studentId: string;
let courseId: string;
let lessonId: string;

describe('Courses API', () => {
  beforeAll(async () => {
    // Initialize test database
    await DatabaseService.initialize();
    
    // Clean up any existing test data
    await DatabaseService.query(
      'DELETE FROM users WHERE email IN ($1, $2)',
      [TEST_INSTRUCTOR.email, TEST_STUDENT.email]
    );
    
    // Create test users
    const instructorData = await createTestUser(TEST_INSTRUCTOR);
    const studentData = await createTestUser(TEST_STUDENT);
    
    instructorId = instructorData.user.id;
    studentId = studentData.user.id;
    instructorToken = instructorData.token;
    studentToken = studentData.token;
    
    // Set instructor role
    await DatabaseService.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['instructor', instructorId]
    );
  });
  
  afterAll(async () => {
    // Clean up test data
    if (courseId) {
      await DatabaseService.query('DELETE FROM courses WHERE id = $1', [courseId]);
    }
    if (instructorId) {
      await deleteTestUser(instructorId);
    }
    if (studentId) {
      await deleteTestUser(studentId);
    }
    
    await DatabaseService.close();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/courses', () => {
    it('should create a new course as instructor', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(TEST_COURSE)
        .expect(201);
      
      expect(response.body).toHaveProperty('course');
      expect(response.body.course.title).toBe(TEST_COURSE.title);
      expect(response.body.course.description).toBe(TEST_COURSE.description);
      expect(response.body.course.level).toBe(TEST_COURSE.level);
      expect(response.body.course.instructorId).toBe(instructorId);
      
      courseId = response.body.course.id;
    });
    
    it('should not create course without authentication', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send(TEST_COURSE)
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should not create course as student', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(TEST_COURSE)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: '', // Empty title
          description: 'Test description'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
    
    it('should validate course level', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          ...TEST_COURSE,
          title: 'Another Course',
          level: 'invalid-level'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('GET /api/courses', () => {
    it('should get all published courses', async () => {
      const response = await request(app)
        .get('/api/courses')
        .expect(200);
      
      expect(response.body).toHaveProperty('courses');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.courses)).toBe(true);
      expect(response.body.courses.length).toBeGreaterThan(0);
    });
    
    it('should filter courses by level', async () => {
      const response = await request(app)
        .get('/api/courses?level=beginner')
        .expect(200);
      
      expect(response.body).toHaveProperty('courses');
      response.body.courses.forEach((course: any) => {
        expect(course.level).toBe('beginner');
      });
    });
    
    it('should filter courses by category', async () => {
      const response = await request(app)
        .get('/api/courses?category=language')
        .expect(200);
      
      expect(response.body).toHaveProperty('courses');
      response.body.courses.forEach((course: any) => {
        expect(course.category).toBe('language');
      });
    });
    
    it('should search courses by title', async () => {
      const response = await request(app)
        .get('/api/courses?search=Tahitian')
        .expect(200);
      
      expect(response.body).toHaveProperty('courses');
      response.body.courses.forEach((course: any) => {
        expect(course.title.toLowerCase()).toContain('tahitian');
      });
    });
    
    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/courses?page=1&limit=5')
        .expect(200);
      
      expect(response.body).toHaveProperty('courses');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.courses.length).toBeLessThanOrEqual(5);
    });
  });
  
  describe('GET /api/courses/:id', () => {
    it('should get course by id', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('course');
      expect(response.body.course.id).toBe(courseId);
      expect(response.body.course.title).toBe(TEST_COURSE.title);
    });
    
    it('should return 404 for non-existent course', async () => {
      const response = await request(app)
        .get('/api/courses/non-existent-id')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should include lessons for authenticated users', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(response.body.course).toHaveProperty('lessons');
    });
  });
  
  describe('PUT /api/courses/:id', () => {
    it('should update course as instructor', async () => {
      const updateData = {
        title: 'Updated Tahitian Course',
        description: 'Updated description',
        price: 39.99
      };
      
      const response = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).toHaveProperty('course');
      expect(response.body.course.title).toBe(updateData.title);
      expect(response.body.course.description).toBe(updateData.description);
      expect(response.body.course.price).toBe(updateData.price);
    });
    
    it('should not update course without authentication', async () => {
      const response = await request(app)
        .put(`/api/courses/${courseId}`)
        .send({ title: 'Unauthorized Update' })
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should not update course as different instructor', async () => {
      // Create another instructor
      const anotherInstructor = await createTestUser({
        email: 'another@example.com',
        password: 'Password123!',
        firstName: 'Another',
        lastName: 'Instructor'
      });
      
      const response = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${anotherInstructor.token}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
      
      // Clean up
      await deleteTestUser(anotherInstructor.user.id);
    });
  });
  
  describe('DELETE /api/courses/:id', () => {
    it('should not delete course with enrolled students', async () => {
      // First enroll student in course
      await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      const response = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('enrolled students');
    });
  });
  
  describe('POST /api/courses/:id/enroll', () => {
    it('should enroll student in course', async () => {
      const response = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('enrollment');
      expect(response.body.enrollment.courseId).toBe(courseId);
      expect(response.body.enrollment.studentId).toBe(studentId);
    });
    
    it('should not enroll twice in same course', async () => {
      const response = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(409);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should not enroll without authentication', async () => {
      const response = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/courses/:id/students', () => {
    it('should get enrolled students as instructor', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}/students`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('students');
      expect(Array.isArray(response.body.students)).toBe(true);
      expect(response.body.students.length).toBeGreaterThan(0);
    });
    
    it('should not get students as non-instructor', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}/students`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('Course Progress Tracking', () => {
    it('should track course progress', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('progress');
      expect(response.body.progress).toHaveProperty('completedLessons');
      expect(response.body.progress).toHaveProperty('totalLessons');
      expect(response.body.progress).toHaveProperty('percentage');
    });
    
    it('should update lesson completion', async () => {
      // First create a lesson
      const lessonResponse = await request(app)
        .post(`/api/courses/${courseId}/lessons`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(TEST_LESSON)
        .expect(201);
      
      lessonId = lessonResponse.body.lesson.id;
      
      // Mark lesson as completed
      const response = await request(app)
        .post(`/api/courses/${courseId}/lessons/${lessonId}/complete`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('completion');
      expect(response.body.completion.completed).toBe(true);
    });
  });
  
  describe('Course Reviews', () => {
    it('should add course review', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Excellent course! Learned a lot about Tahitian culture.'
      };
      
      const response = await request(app)
        .post(`/api/courses/${courseId}/reviews`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(reviewData)
        .expect(201);
      
      expect(response.body).toHaveProperty('review');
      expect(response.body.review.rating).toBe(reviewData.rating);
      expect(response.body.review.comment).toBe(reviewData.comment);
    });
    
    it('should get course reviews', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}/reviews`)
        .expect(200);
      
      expect(response.body).toHaveProperty('reviews');
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalReviews');
    });
    
    it('should validate review rating', async () => {
      const response = await request(app)
        .post(`/api/courses/${courseId}/reviews`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rating: 6, // Invalid rating (should be 1-5)
          comment: 'Test review'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('Course Analytics', () => {
    it('should get course analytics as instructor', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}/analytics`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveProperty('enrollmentCount');
      expect(response.body.analytics).toHaveProperty('completionRate');
      expect(response.body.analytics).toHaveProperty('averageRating');
      expect(response.body.analytics).toHaveProperty('revenueGenerated');
    });
    
    it('should not get analytics as student', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}/analytics`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});