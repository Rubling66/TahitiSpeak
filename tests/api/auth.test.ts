import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../api/server';
import { AuthService } from '../../api/services/AuthService';
import { DatabaseService } from '../../api/services/DatabaseService';
import { logger } from '../../src/services/LoggingService';

// Test configuration
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'AdminPassword123!',
  firstName: 'Admin',
  lastName: 'User'
};

let testUserId: string;
let adminUserId: string;
let userToken: string;
let adminToken: string;

describe('Authentication API', () => {
  beforeAll(async () => {
    // Initialize test database
    await DatabaseService.initialize();
    
    // Clean up any existing test data
    await DatabaseService.query(
      'DELETE FROM users WHERE email IN ($1, $2)',
      [TEST_USER.email, ADMIN_USER.email]
    );
  });
  
  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await DatabaseService.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    if (adminUserId) {
      await DatabaseService.query('DELETE FROM users WHERE id = $1', [adminUserId]);
    }
    
    await DatabaseService.close();
  });
  
  beforeEach(() => {
    // Reset any mocks or state
    jest.clearAllMocks();
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(TEST_USER.email);
      expect(response.body.user.firstName).toBe(TEST_USER.firstName);
      expect(response.body.user.lastName).toBe(TEST_USER.lastName);
      expect(response.body.user).not.toHaveProperty('password');
      
      testUserId = response.body.user.id;
      userToken = response.body.token;
    });
    
    it('should not register user with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(409);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123' // Too short
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
    
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...TEST_USER,
          email: 'invalid-email-format'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
    
    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...TEST_USER,
          email: 'test2@example.com',
          password: 'weak'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(TEST_USER.email);
      expect(response.body.user).not.toHaveProperty('password');
      
      userToken = response.body.token;
    });
    
    it('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: TEST_USER.password
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(TEST_USER.email);
      expect(response.body.user).not.toHaveProperty('password');
    });
    
    it('should not get user without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should not get user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio'
      };
      
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(updateData.lastName);
      expect(response.body.user.bio).toBe(updateData.bio);
    });
    
    it('should not update profile without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ firstName: 'Test' })
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should validate profile data', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: '', // Empty string should be invalid
          email: 'invalid-email'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('POST /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const newPassword = 'NewPassword123!';
      
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: TEST_USER.password,
          newPassword: newPassword,
          confirmPassword: newPassword
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      
      // Test login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: newPassword
        })
        .expect(200);
      
      userToken = loginResponse.body.token;
    });
    
    it('should not change password with invalid current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should not change password when passwords do not match', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'NewPassword123!',
          newPassword: 'Password1!',
          confirmPassword: 'Password2!'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: TEST_USER.email })
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
    });
    
    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200); // Should still return 200 for security
      
      expect(response.body).toHaveProperty('message');
    });
    
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
    });
    
    it('should handle logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('Token Management', () => {
    it('should refresh token', async () => {
      // First login to get a fresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'NewPassword123!'
        })
        .expect(200);
      
      const token = loginResponse.body.token;
      
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(token);
    });
    
    it('should validate token expiration', async () => {
      // This test would require mocking time or using expired tokens
      // For now, we'll test with an obviously invalid token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const promises = [];
      
      // Make multiple rapid login attempts
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: TEST_USER.email,
              password: 'wrongpassword'
            })
        );
      }
      
      const responses = await Promise.all(promises);
      
      // At least some should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
  
  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});

// Helper functions for testing
export const createTestUser = async (userData: any) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);
  
  return response.body;
};

export const loginTestUser = async (email: string, password: string) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.body;
};

export const deleteTestUser = async (userId: string) => {
  await DatabaseService.query('DELETE FROM users WHERE id = $1', [userId]);
};