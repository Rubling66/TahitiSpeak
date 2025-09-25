import request from 'supertest';
import { app } from '../../api/app';
import { DatabaseService } from '../../api/services/DatabaseService';

describe('Lessons API', () => {
  beforeAll(async () => {
    // Setup test database
    await DatabaseService.initialize();
  });

  afterAll(async () => {
    // Cleanup
    await DatabaseService.close();
  });

  describe('GET /api/lessons', () => {
    it('should return lessons list', async () => {
      const response = await request(app)
        .get('/api/lessons')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/lessons/:id', () => {
    it('should return a specific lesson', async () => {
      const response = await request(app)
        .get('/api/lessons/1')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
    });

    it('should return 404 for non-existent lesson', async () => {
      await request(app)
        .get('/api/lessons/999999')
        .expect(404);
    });
  });
});