const path = require('path');
const sqlite3 = require('sqlite3');
const supertest = require('supertest');
const { createAppAndDb } = require('../tests/test-utils.cjs');

let app, db, token;

beforeAll(async () => {
  const testDbPath = path.join(__dirname, 'test-posts.db');
  db = new sqlite3.Database(testDbPath);
  ({ app } = await createAppAndDb(db));
  const login = await supertest(app)
    .post('/api/auth/login')
    .send({ email: 'joao@r10piaui.com', password: 'admin' });
  token = login.body.accessToken;
});

afterAll(async () => { db.close(); });

describe('Posts CRUD básico (sanitização)', () => {
  let createdId;
  test('criar post simples', async () => {
    const res = await supertest(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Teste', corpo: '<script>alert(1)</script><p>Ok</p>' });
    expect([200,201]).toContain(res.status);
    expect(res.body).toHaveProperty('id');
    createdId = res.body.id;
    // corpo sanitizado não deve conter <script>
    expect(JSON.stringify(res.body)).not.toMatch(/<script>/i);
  });

  test('listar posts inclui criado', async () => {
    const res = await supertest(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const ids = (res.body.items||[]).map(p=>String(p.id));
    expect(ids).toContain(String(createdId));
  });
});
