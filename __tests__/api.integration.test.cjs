const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const request = require('supertest');

const TEST_DB_PATH = path.join(__dirname, 'tmp-api.sqlite');
let createApp;

const run = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve(this);
  });
});

const get = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const close = (db) => new Promise((resolve, reject) => {
  db.close((err) => (err ? reject(err) : resolve()));
});

describe('R10 API - fluxos principais', () => {
  let app;
  let db;

  beforeAll(async () => {
    try { fs.unlinkSync(TEST_DB_PATH); } catch (_) {}

    await new Promise((resolve, reject) => {
      const seedDb = new sqlite3.Database(TEST_DB_PATH);
      seedDb.serialize(() => {
        seedDb.run(`CREATE TABLE IF NOT EXISTS web_analytics_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          path TEXT NOT NULL,
          session_id TEXT,
          ip_hash TEXT,
          ua TEXT,
          referer TEXT,
          created_at TEXT
        )`);
        seedDb.run('CREATE INDEX IF NOT EXISTS idx_web_analytics_date ON web_analytics_events(date)');
        seedDb.run('CREATE INDEX IF NOT EXISTS idx_web_analytics_path ON web_analytics_events(path)');
      });
      seedDb.close((err) => (err ? reject(err) : resolve()));
    });

    // Definir JWT_SECRET antes de carregar o módulo
    process.env.JWT_SECRET = 'test-secret-key-with-at-least-32-characters-for-security';
    
    ({ createApp } = require('../server/server-api-simple.cjs'));
    app = createApp({ dbPath: TEST_DB_PATH });
    db = app.locals.db;

    await run(
      db,
      `CREATE TABLE IF NOT EXISTS noticias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT,
        subtitulo TEXT,
        conteudo TEXT,
        resumo TEXT,
        imagem TEXT,
        imagemUrl TEXT,
        imagem_destaque TEXT,
        categoria TEXT,
        chapeu TEXT,
        posicao TEXT,
        autor TEXT,
        created_at TEXT,
        published_at TEXT,
        views INTEGER DEFAULT 0,
        slug TEXT
      )`
    );

    await run(db, 'DELETE FROM noticias');

    await run(
      db,
      `CREATE TABLE IF NOT EXISTS web_analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        path TEXT NOT NULL,
        session_id TEXT,
        ip_hash TEXT,
        ua TEXT,
        referer TEXT,
        created_at TEXT
      )`
    );
    await run(db, 'CREATE INDEX IF NOT EXISTS idx_web_analytics_date ON web_analytics_events(date)');
    await run(db, 'CREATE INDEX IF NOT EXISTS idx_web_analytics_path ON web_analytics_events(path)');
    await run(db, 'DELETE FROM web_analytics_events');

    const now = new Date().toISOString();
    const posts = [
      { titulo: 'Super Manchete', posicao: 'supermanchete', categoria: 'politica', views: 42 },
      { titulo: 'Primeiro Destaque', posicao: 'destaque', categoria: 'policia', views: 21 },
      { titulo: 'Segundo Destaque', posicao: 'destaque', categoria: 'esporte', views: 13 },
      { titulo: 'Notícia Geral 1', posicao: 'geral', categoria: 'geral', views: 8 },
      { titulo: 'Notícia Geral 2', posicao: 'geral', categoria: 'geral', views: 5 }
    ];

    for (const post of posts) {
      await run(
        db,
        `INSERT INTO noticias (
          titulo, conteudo, resumo, imagem, imagemUrl, imagem_destaque,
          categoria, chapeu, posicao, autor, created_at, published_at, views
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          post.titulo,
          `${post.titulo} - conteúdo completo`,
          `${post.titulo} - resumo`,
          '/placeholder.svg',
          '/placeholder.svg',
          '/placeholder.svg',
          post.categoria,
          `Chapéu ${post.titulo}`,
          post.posicao,
          'Equipe R10',
          now,
          now,
          post.views
        ]
      );
    }

    // Aguarda seed do usuário administrador padrão
    await get(db, 'SELECT id FROM usuarios WHERE email = ?', ['joao@r10piaui.com']);
  });

  afterAll(async () => {
    if (db) {
      await close(db);
    }
    try { fs.unlinkSync(TEST_DB_PATH); } catch (_) {}
  });

  beforeEach(() => {
    if (app) {
      app.locals.homeCache = { body: null, expiresAt: 0, lastModified: null };
    }
  });

  it('expõe health check com métricas e contadores', async () => {
    const res = await request(app).get('/api/health').expect(200);

    expect(res.body).toMatchObject({
      status: 'ok',
      db: {
        ok: true,
      },
    });
    expect(res.body.db.postsCount).toBeGreaterThanOrEqual(5);
    expect(res.body.db.usersCount).toBeGreaterThanOrEqual(1);
    expect(res.body.cache.home).toHaveProperty('has');
  });

  it('protege recursos privados quando não autenticado', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('bloqueia login com credenciais inválidas', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@r10piaui.com', password: 'errado' })
      .expect(401);
  });

  it('realiza login, acessa /me e renova sessão', async () => {
    const agent = request.agent(app);

    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: 'joao@r10piaui.com', password: 'admin' })
      .expect(200);

    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.user).toMatchObject({
      email: 'joao@r10piaui.com',
      name: 'João Silva',
    });
    const setCookie = loginRes.headers['set-cookie'].join(';');
    expect(setCookie).toContain('r10_access');
    expect(setCookie).toContain('r10_refresh');
    expect(setCookie).toContain('HttpOnly');

    const meRes = await agent.get('/api/auth/me').expect(200);
    expect(meRes.body).toMatchObject({
      email: 'joao@r10piaui.com',
      role: 'admin',
    });

    const refreshRes = await agent.post('/api/auth/refresh').expect(200);
    expect(refreshRes.body.user.email).toBe('joao@r10piaui.com');
    const refreshedCookies = refreshRes.headers['set-cookie'].join(';');
    expect(refreshedCookies).toContain('r10_access');
    expect(refreshedCookies).toContain('r10_refresh');
  });

  it('monta home com hero, destaques e utiliza cache em memória', async () => {
    const first = await request(app).get('/api/home').expect(200);
    expect(first.headers['x-cache']).toBe('MISS');
    expect(Array.isArray(first.body.hero)).toBe(true);
    expect(first.body.hero.length).toBe(1);
    expect(first.body.hero[0]).toHaveProperty('titulo', 'Super Manchete');
    expect(first.body.destaques.length).toBeGreaterThanOrEqual(2);
    expect(first.body.geral.length).toBeGreaterThanOrEqual(2);

    const second = await request(app).get('/api/home').expect(200);
    expect(second.headers['x-cache']).toBe('HIT');
    expect(second.body.hero[0].titulo).toBe('Super Manchete');
  });
});
