-- Baseline schema: cria tabelas principais se ainda não existirem (idempotente)
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  avatar TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  user_agent TEXT,
  ip TEXT
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT,
  type TEXT NOT NULL CHECK (type IN ('editorial','municipality','special')),
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS web_analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  path TEXT NOT NULL,
  session_id TEXT,
  ip_hash TEXT,
  ua TEXT,
  referer TEXT,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_web_analytics_date ON web_analytics_events(date);
CREATE INDEX IF NOT EXISTS idx_web_analytics_path ON web_analytics_events(path);
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  cliente TEXT,
  imagem TEXT,
  link TEXT,
  posicao TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho TEXT,
  status TEXT NOT NULL,
  data_inicio TEXT,
  data_fim TEXT,
  impressoes_max INTEGER,
  cliques_max INTEGER,
  impressoes_atuais INTEGER DEFAULT 0,
  cliques_atuais INTEGER DEFAULT 0,
  cpm REAL,
  cpc REAL,
  valor_total REAL,
  prioridade INTEGER DEFAULT 3,
  conteudo_html TEXT,
  observacoes TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  user_agent TEXT,
  ip TEXT
);
CREATE TABLE IF NOT EXISTS social_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  date TEXT NOT NULL,
  followers INTEGER NOT NULL,
  engagement INTEGER NOT NULL,
  created_at TEXT,
  UNIQUE(source, date)
);
