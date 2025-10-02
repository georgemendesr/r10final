const request = require('supertest');
const { spawn } = require('child_process');

let serverProcess; const baseUrl = 'http://localhost:3022';
let authCookies = '';

function extractCookies(res){
  const set = res.headers['set-cookie']||[]; return set.map(c=>c.split(';')[0]).join('; ');
}

beforeAll(async () => {
  serverProcess = spawn(process.execPath, ['server/server-api-simple.cjs'], {
    env: { ...process.env, PORT: '3022', NODE_ENV: 'test', JWT_SECRET: 'z'.repeat(40) },
    stdio: 'inherit'
  });
  await new Promise(r=>setTimeout(r,1300));
  // login admin default
  const login = await request(baseUrl).post('/api/auth/login').send({ email: 'joao@r10piaui.com', password: 'admin' });
  expect(login.status).toBe(200);
  authCookies = extractCookies(login);
});

afterAll(()=> serverProcess && serverProcess.kill());

describe('CRUD Notícias', () => {
  let createdId;

  test('criar notícia', async ()=>{
    const body = { titulo: 'Teste CRUD', conteudo: 'Corpo <b>HTML</b>', categoria: 'geral', status: 'publicado' };
    const res = await request(baseUrl).post('/api/admin/noticias').set('Cookie', authCookies).send(body);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    createdId = res.body.id;
  });

  test('listar notícia criada', async ()=>{
    const res = await request(baseUrl).get(`/api/admin/noticias/${createdId}`).set('Cookie', authCookies);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', createdId);
  });

  test('atualizar notícia', async ()=>{
    const res = await request(baseUrl).put(`/api/admin/noticias/${createdId}`).set('Cookie', authCookies)
      .send({ titulo: 'Teste CRUD Editado' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('titulo', 'Teste CRUD Editado');
  });

  test('deletar notícia', async ()=>{
    const res = await request(baseUrl).delete(`/api/admin/noticias/${createdId}`).set('Cookie', authCookies);
    expect(res.status).toBe(200);
  });

  test('404 após deletar', async ()=>{
    const res = await request(baseUrl).get(`/api/admin/noticias/${createdId}`).set('Cookie', authCookies);
    expect(res.status).toBe(404);
  });
});
