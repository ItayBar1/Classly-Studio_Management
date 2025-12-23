import request from 'supertest';
import app from '../../src/app';
import { getLastQuery, queueQueryResponse, resetSupabaseMock } from '../mocks/supabaseAdmin';

jest.mock('../../src/config/supabase', () => require('../mocks/supabaseAdmin'));
jest.mock('../../src/middleware/authMiddleware', () => {
  return {
    authenticateUser: (req: any, res: any, next: any) => {
      const roleHeader = (req.headers['x-test-role'] as string | undefined)?.toUpperCase();
      const role = roleHeader || 'ADMIN';
      req.user = { id: 'user-1', role, studio_id: 'studio-1' };
      req.studioId = 'studio-1';
      return next();
    },
    requireRole: (allowedRoles: string[]) => {
      const normalized = allowedRoles.map((role) => role.toUpperCase());
      return (req: any, res: any, next: any) => {
        const role = (req.user?.role || '').toUpperCase();
        if (!role || !normalized.includes(role)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        return next();
      };
    },
  };
});

describe('Course routes', () => {
  beforeEach(() => {
    resetSupabaseMock();
  });

  it('returns all courses for admin', async () => {
    const courses = [{ id: '1', name: 'Yoga', is_active: true }];
    queueQueryResponse({ data: courses, error: null });

    const response = await request(app).get('/api/courses');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(courses);
    expect(getLastQuery()?.table).toBe('classes');
  });

  it('filters active courses for students', async () => {
    queueQueryResponse({ data: [], error: null });

    const response = await request(app)
      .get('/api/courses')
      .set('x-test-role', 'student');

    expect(response.status).toBe(200);
    const lastQuery = getLastQuery();
    expect(lastQuery?.eq).toHaveBeenCalledWith('is_active', true);
  });
});
