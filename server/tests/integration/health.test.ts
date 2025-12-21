import request from 'supertest';
import app from '../../src/app';

describe('Health endpoint', () => {
  it('returns server status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK', message: 'Server is running 🚀' });
  });
});
