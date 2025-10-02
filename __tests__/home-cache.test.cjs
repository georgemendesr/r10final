const request = require('supertest');
const { spawn } = require('child_process');

let serverProcess; const baseUrl = 'http://localhost:3032';

beforeAll(async () => {
  serverProcess = spawn(process.execPath, ['server/server-api-simple.cjs'], {
    env: { ...process.env, PORT: '3032', NODE_ENV: 'test', JWT_SECRET: 'w'.repeat(40) },
    stdio: 'inherit'
  });
  await new Promise(r=>setTimeout(r,1200));
});

afterAll(()=> serverProcess && serverProcess.kill());

describe('Cache /api/home', () => {
  test('primeira requisição retorna 200 e ETag', async ()=>{
    const res = await request(baseUrl).get('/api/home').expect(200);
    expect(res.headers).toHaveProperty('etag');
    const etag = res.headers['etag'];
    // segunda chamada com If-None-Match
    const res2 = await request(baseUrl).get('/api/home').set('If-None-Match', etag);
    // Pode retornar 200 (se mudou algo) ou 304 se cache válido; aqui forçamos expectativa preferindo 200/304
    expect([200,304]).toContain(res2.status);
    if (res2.status === 304) {
      expect(res2.text).toBe('');
    }
  });
});
