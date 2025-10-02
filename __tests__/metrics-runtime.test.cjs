const request = require('supertest');

let serverProcess;
const baseUrl = 'http://localhost:3012';

beforeAll(async () => {
  const { spawn } = require('child_process');
  serverProcess = spawn(process.execPath, ['server/server-api-simple.cjs'], {
    env: { ...process.env, NODE_ENV: 'test', PORT: '3012', JWT_SECRET: 'y'.repeat(40) },
    stdio: 'inherit'
  });
  await new Promise(r => setTimeout(r, 1200));
});

afterAll(() => { if (serverProcess) serverProcess.kill(); });

describe('Metrics Runtime Endpoint', () => {
  test('retorna estrutura esperada', async () => {
    const res = await request(baseUrl).get('/api/metrics/runtime').expect(200);
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('memoryMB');
    expect(res.body).toHaveProperty('requests');
    expect(res.body.requests).toHaveProperty('total');
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });
});
