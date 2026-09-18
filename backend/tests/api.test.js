// Basic API tests using Jest + Supertest.
// These are "integration" tests: they start the real Express app
// and make real HTTP requests against it, hitting a real (test)
// PostgreSQL database. Run with: npm test
// Requires the app + database to be running (e.g. via docker compose).
const request = require('supertest');
const app = require('../src/app');

const randomEmail = () => `test_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;

describe('Auth', () => {
  let token;
  const email = randomEmail();
  const password = 'password123';

  test('POST /api/auth/register creates a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, fullName: 'Test User' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  test('POST /api/auth/register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, fullName: 'Test User' });

    expect(res.statusCode).toBe(409);
  });

  test('POST /api/auth/login succeeds with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/auth/login fails with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/users/me requires authentication', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/users/me returns profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(email);
  });
});

describe('Jobs', () => {
  test('GET /api/jobs returns a list (public route)', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

  test('GET /api/jobs supports search filters + pagination', async () => {
    const res = await request(app).get('/api/jobs?skill=python&page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
  });
});

describe('Recommendations', () => {
  let token;
  beforeAll(async () => {
    const email = randomEmail();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', fullName: 'Rec Tester' });
    token = res.body.token;
  });

  test('GET /api/recommendations requires authentication', async () => {
    const res = await request(app).get('/api/recommendations');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/recommendations returns ranked jobs for logged-in user', async () => {
    const res = await request(app)
      .get('/api/recommendations?topK=3')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });
});
