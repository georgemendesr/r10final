const path = require('path');
const sqlite3 = require('sqlite3');
const supertest = require('supertest');

// Para testar o servidor existente, vamos importar a factory createApp do arquivo principal.
// O arquivo server-api-simple.cjs define createApp. Caso mude, ajustar require.
const { createAppAndDb } = require('../tests/test-utils.cjs');

let app, db;

beforeAll(async () => {
  const testDbPath = path.join(__dirname, 'test-auth.db');
  db = new sqlite3.Database(testDbPath);
  ({ app } = await createAppAndDb(db));
});

afterAll(async () => {
  db.close();
});

describe('Auth Flow', () => {
  test('login falha com credenciais inválidas', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@example.com', password: 'errado' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('login admin seed funciona e /api/health acessível autenticado', async () => {
    const resLogin = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'joao@r10piaui.com', password: 'admin' });
    expect(resLogin.status).toBe(200);
    expect(resLogin.body).toHaveProperty('accessToken');
    const token = resLogin.body.accessToken;

    const resHealth = await supertest(app)
      .get('/api/health')
      .set('Authorization', `Bearer ${token}`);
    // /api/health é público? No código original não exige auth, então aceitar 200
    expect(resHealth.status).toBe(200);
    expect(resHealth.body).toHaveProperty('status');
  });
});
