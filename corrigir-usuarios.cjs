const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

// Função para criar hash de senha
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, 32);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

const dbPath = path.join(__dirname, 'server', 'noticias.db');
console.log('Abrindo banco de dados:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir banco:', err);
    process.exit(1);
  }
  console.log('✅ Banco aberto com sucesso\n');
});

// Primeiro, verificar usuários existentes
db.all('SELECT id, name, email, role FROM usuarios', [], (err, users) => {
  if (err) {
    console.error('❌ Erro ao listar usuários:', err);
    db.close();
    return;
  }

  console.log('=== USUÁRIOS ATUAIS ===');
  console.log(JSON.stringify(users, null, 2));
  console.log('');

  // Atualizar senha do George
  const georgeSenha = hashPassword('admin');
  db.run(
    'UPDATE usuarios SET password_hash = ? WHERE email = ?',
    [georgeSenha, 'george@r10piaui.com'],
    function(err) {
      if (err) {
        console.error('❌ Erro ao atualizar George:', err);
      } else if (this.changes > 0) {
        console.log('✅ Senha do George atualizada para "admin"');
      }
    }
  );

  // Criar João se não existir
  const joaoSenha = hashPassword('admin');
  const createdAt = new Date().toISOString();
  
  db.run(
    'INSERT INTO usuarios (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash',
    ['João Silva', 'joao@r10piaui.com', joaoSenha, 'admin', createdAt],
    function(err) {
      if (err) {
        console.error('❌ Erro ao criar/atualizar João:', err);
      } else {
        console.log('✅ Usuário joao@r10piaui.com criado/atualizado (senha: admin)');
      }
      
      // Verificar resultado final
      setTimeout(() => {
        console.log('\n=== USUÁRIOS FINAIS ===');
        db.all('SELECT id, name, email, role FROM usuarios', [], (err, finalUsers) => {
          if (!err) {
            console.log(JSON.stringify(finalUsers, null, 2));
          }
          console.log('\n✅ CORREÇÃO CONCLUÍDA!');
          console.log('\n📝 Credenciais de teste:');
          console.log('   Email: joao@r10piaui.com');
          console.log('   Senha: admin');
          console.log('');
          console.log('   Email: george@r10piaui.com');
          console.log('   Senha: admin\n');
          db.close();
        });
      }, 500);
    }
  );
});
