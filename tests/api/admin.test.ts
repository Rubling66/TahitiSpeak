import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../api/app';
import { DatabaseService } from '../../api/services/DatabaseService';
import { createTestUser, deleteTestUser } from './auth.test';
import { logger } from '../../src/services/LoggingService';

// Test data
const TEST_ADMIN = {
  email: 'admin@example.com',
  password: 'AdminPass123!',
  firstName: 'Test',
  lastName: 'Admin',
  role: 'admin'
};

const TEST_INSTRUCTOR = {
  email: 'test-instructor@example.com',
  password: 'InstructorPass123!',
  firstName: 'Test',
  lastName: 'Instructor',
  role: 'instructor'
};

const TEST_STUDENT = {
  email: 'test-student@example.com',
  password: 'StudentPass123!',
  firstName: 'Test',
  lastName: 'Student',
  role: 'student'
};

const TEST_USER_UPDATE = {
  firstName: 'Updated',
  lastName: 'Name',
  email: 'updated@example.com',
  role: 'instructor'
};

const TEST_COURSE_DATA = {
  title: 'Admin Test Course',
  description: 'Course created for admin testing',
  level: 'intermediate',
  category: 'culture',
  duration: 90,
  price: 49.99,
  isPublished: false
};

let adminToken: string;
let instructorToken: string;
let studentToken: string;
let adminId: string;
let instructorId: string;
let studentId: string;
let testCourseId: string;

describe('Admin API', () => {
  beforeAll(async () => {
    // Initialize test database
    await DatabaseService.initialize();
    
    // Clean up any existing test data
    await DatabaseService.query(
      'DELETE FROM users WHERE email IN ($1, $2, $3)',
      [TEST_ADMIN.email, TEST_INSTRUCTOR.email, TEST_STUDENT.email]
    );
    
    // Create test users
    const adminData = await createTestUser(TEST_ADMIN);
    const instructorData = await createTestUser(TEST_INSTRUCTOR);
    const studentData = await createTestUser(TEST_STUDENT);
    
    adminId = adminData.user.id;
    instructorId = instructorData.user.id;
    studentId = studentData.user.id;
    adminToken = adminData.token;
    instructorToken = instructorData.token;
    studentToken = studentData.token;
    
    // Set user roles
    await DatabaseService.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['admin', adminId]
    );
    await DatabaseService.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['instructor', instructorId]
    );
  });
  
  afterAll(async () => {
    // Clean up test data
    if (testCourseId) {
      await DatabaseService.query('DELETE FROM courses WHERE id = $1', [testCourseId]);
    }
    if (adminId) {
      await deleteTestUser(adminId);
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
  
  describe('GET /api/admin/dashboard', () => {
    it('should get admin dashboard data', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('dashboard');
      expect(response.body.dashboard).toHaveProperty('stats');
      expect(response.body.dashboard).toHaveProperty('recentActivity');
      expect(response.body.dashboard).toHaveProperty('systemHealth');
      
      // Check stats structure
      const stats = response.body.dashboard.stats;
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('totalCourses');
      expect(stats).toHaveProperty('totalEnrollments');
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats).toHaveProperty('activeUsers');
      expect(stats).toHaveProperty('newUsersThisMonth');
    });
    
    it('should not allow non-admin access', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/admin/users', () => {
    it('should get all users with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
      
      // Check user structure
      const user = response.body.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('createdAt');
      expect(user).not.toHaveProperty('password'); // Should not include password
    });
    
    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=instructor')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('users');
      response.body.users.forEach((user: any) => {
        expect(user.role).toBe('instructor');
      });
    });
    
    it('should search users by email', async () => {
      const response = await request(app)
        .get(`/api/admin/users?search=${TEST_INSTRUCTOR.email}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('users');
      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users[0].email).toBe(TEST_INSTRUCTOR.email);
    });
    
    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.users.length).toBeLessThanOrEqual(2);
    });
  });
  
  describe('GET /api/admin/users/:id', () => {
    it('should get user by id', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${instructorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(instructorId);
      expect(response.body.user.email).toBe(TEST_INSTRUCTOR.email);
      expect(response.body.user).toHaveProperty('profile');
      expect(response.body.user).toHaveProperty('activity');
    });
    
    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/admin/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /api/admin/users/:id', () => {
    it('should update user as admin', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${instructorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(TEST_USER_UPDATE)
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.firstName).toBe(TEST_USER_UPDATE.firstName);
      expect(response.body.user.lastName).toBe(TEST_USER_UPDATE.lastName);
      expect(response.body.user.role).toBe(TEST_USER_UPDATE.role);
    });
    
    it('should validate email format', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${instructorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
    
    it('should validate role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${instructorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'invalid-role'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('DELETE /api/admin/users/:id', () => {
    it('should not delete user with active enrollments', async () => {
      // First create a course and enroll the student
      const courseResponse = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(TEST_COURSE_DATA);
      
      testCourseId = courseResponse.body.course.id;
      
      await request(app)
        .post(`/api/courses/${testCourseId}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      const response = await request(app)
        .delete(`/api/admin/users/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('active enrollments');
    });
    
    it('should not allow admin to delete themselves', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/admin/users/:id/suspend', () => {
    it('should suspend user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${studentId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Violation of terms of service',
          duration: 30 // days
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.status).toBe('suspended');
      expect(response.body.user.suspension).toHaveProperty('reason');
      expect(response.body.user.suspension).toHaveProperty('expiresAt');
    });
    
    it('should validate suspension reason', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${studentId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          duration: 30
          // Missing reason
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('POST /api/admin/users/:id/unsuspend', () => {
    it('should unsuspend user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${studentId}/unsuspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.status).toBe('active');
      expect(response.body.user.suspension).toBeNull();
    });
  });
  
  describe('GET /api/admin/courses', () => {
    it('should get all courses including unpublished', async () => {
      const response = await request(app)
        .get('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('courses');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.courses)).toBe(true);
      
      // Should include unpublished courses
      const unpublishedCourses = response.body.courses.filter((course: any) => !course.isPublished);
      expect(unpublishedCourses.length).toBeGreaterThan(0);
    });
    
    it('should filter courses by status', async () => {
      const response = await request(app)
        .get('/api/admin/courses?status=draft')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('courses');
      response.body.courses.forEach((course: any) => {
        expect(course.isPublished).toBe(false);
      });
    });
  });
  
  describe('PUT /api/admin/courses/:id/publish', () => {
    it('should publish course', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testCourseId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('course');
      expect(response.body.course.isPublished).toBe(true);
      expect(response.body.course.publishedAt).toBeTruthy();
    });
  });
  
  describe('PUT /api/admin/courses/:id/unpublish', () => {
    it('should unpublish course', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testCourseId}/unpublish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('course');
      expect(response.body.course.isPublished).toBe(false);
    });
  });
  
  describe('GET /api/admin/analytics', () => {
    it('should get system analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveProperty('userGrowth');
      expect(response.body.analytics).toHaveProperty('coursePerformance');
      expect(response.body.analytics).toHaveProperty('revenueMetrics');
      expect(response.body.analytics).toHaveProperty('engagementMetrics');
    });
    
    it('should filter analytics by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      const response = await request(app)
        .get(`/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveProperty('dateRange');
      expect(response.body.analytics.dateRange.start).toBe(startDate);
      expect(response.body.analytics.dateRange.end).toBe(endDate);
    });
  });
  
  describe('GET /api/admin/reports', () => {
    it('should get available reports', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('reports');
      expect(Array.isArray(response.body.reports)).toBe(true);
      
      const report = response.body.reports[0];
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('name');
      expect(report).toHaveProperty('description');
      expect(report).toHaveProperty('type');
    });
  });
  
  describe('POST /api/admin/reports/generate', () => {
    it('should generate user activity report', async () => {
      const response = await request(app)
        .post('/api/admin/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'user-activity',
          format: 'csv',
          dateRange: {
            start: '2024-01-01',
            end: '2024-12-31'
          }
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('id');
      expect(response.body.report).toHaveProperty('status');
      expect(response.body.report).toHaveProperty('downloadUrl');
    });
    
    it('should validate report type', async () => {
      const response = await request(app)
        .post('/api/admin/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'invalid-report-type',
          format: 'csv'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('GET /api/admin/system/health', () => {
    it('should get system health status', async () => {
      const response = await request(app)
        .get('/api/admin/system/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('health');
      expect(response.body.health).toHaveProperty('status');
      expect(response.body.health).toHaveProperty('services');
      expect(response.body.health).toHaveProperty('metrics');
      
      // Check services health
      const services = response.body.health.services;
      expect(services).toHaveProperty('database');
      expect(services).toHaveProperty('redis');
      expect(services).toHaveProperty('storage');
      
      // Check metrics
      const metrics = response.body.health.metrics;
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cpuUsage');
    });
  });
  
  describe('GET /api/admin/system/logs', () => {
    it('should get system logs', async () => {
      const response = await request(app)
        .get('/api/admin/system/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('logs');
      expect(Array.isArray(response.body.logs)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      
      if (response.body.logs.length > 0) {
        const log = response.body.logs[0];
        expect(log).toHaveProperty('timestamp');
        expect(log).toHaveProperty('level');
        expect(log).toHaveProperty('message');
      }
    });
    
    it('should filter logs by level', async () => {
      const response = await request(app)
        .get('/api/admin/system/logs?level=error')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('logs');
      response.body.logs.forEach((log: any) => {
        expect(log.level).toBe('error');
      });
    });
  });
  
  describe('POST /api/admin/system/maintenance', () => {
    it('should enable maintenance mode', async () => {
      const response = await request(app)
        .post('/api/admin/system/maintenance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          enabled: true,
          message: 'System maintenance in progress',
          estimatedDuration: 60 // minutes
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('maintenance');
      expect(response.body.maintenance.enabled).toBe(true);
      expect(response.body.maintenance.message).toBe('System maintenance in progress');
    });
    
    it('should disable maintenance mode', async () => {
      const response = await request(app)
        .post('/api/admin/system/maintenance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          enabled: false
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('maintenance');
      expect(response.body.maintenance.enabled).toBe(false);
    });
  });
  
  describe('GET /api/admin/audit-logs', () => {
    it('should get audit logs', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('auditLogs');
      expect(Array.isArray(response.body.auditLogs)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      
      if (response.body.auditLogs.length > 0) {
        const auditLog = response.body.auditLogs[0];
        expect(auditLog).toHaveProperty('id');
        expect(auditLog).toHaveProperty('action');
        expect(auditLog).toHaveProperty('userId');
        expect(auditLog).toHaveProperty('timestamp');
        expect(auditLog).toHaveProperty('details');
      }
    });
    
    it('should filter audit logs by action', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs?action=user.create')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('auditLogs');
      response.body.auditLogs.forEach((log: any) => {
        expect(log.action).toBe('user.create');
      });
    });
  });
});