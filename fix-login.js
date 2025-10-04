const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, 32);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

const db = new sqlite3.Database('./server/noticias.db');

console.log('\n==========================================');
console.log('CORRIGINDO USUARIOS DO BANCO DE DADOS');
console.log('==========================================\n');

const hash = hashPassword('admin');
const now = new Date().toISOString();

db.serialize(() => {
  // Atualizar George
  db.run(
    'UPDATE usuarios SET password_hash = ? WHERE email = ?',
    [hash, 'george@r10piaui.com'],
    function(err) {
      if (err) {
        console.error('ERRO ao atualizar George:', err.message);
      } else {
        console.log('OK: George senha atualizada (' + this.changes + ' registros)');
      }
    }
  );

  // Criar/atualizar João  
  db.run(
    'INSERT INTO usuarios (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash',
    ['João Silva', 'joao@r10piaui.com', hash, 'admin', now],
    function(err) {
      if (err) {
        console.error('ERRO ao criar João:', err.message);
      } else {
        console.log('OK: João criado/atualizado');
      }
    }
  );

  // Listar usuários
  db.all('SELECT id, name, email, role FROM usuarios', [], (err, users) => {
    console.log('\n==========================================');
    console.log('USUARIOS NO BANCO:');
    console.log('==========================================');
    if (err) {
      console.error('ERRO:', err.message);
    } else {
      users.forEach(u => {
        console.log(`\n  ID: ${u.id}`);
        console.log(`  Nome: ${u.name}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  Role: ${u.role}`);
      });
    }
    console.log('\n==========================================');
    console.log('CREDENCIAIS DE TESTE:');
    console.log('  Email: joao@r10piaui.com');
    console.log('  Senha: admin');
    console.log('');
    console.log('  Email: george@r10piaui.com');
    console.log('  Senha: admin');
    console.log('==========================================\n');
    db.close();
    process.exit(0);
  });
});
