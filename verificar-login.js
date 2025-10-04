const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'noticias.db');
const db = new sqlite3.Database(dbPath);

// Função para verificar senha
function verifyPassword(password, stored) {
  try {
    const [scheme, salt, hashHex] = String(stored||'').split(':');
    if (scheme !== 'scrypt' || !salt || !hashHex) return false;
    const key = crypto.scryptSync(password, salt, 32).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key,'hex'), Buffer.from(hashHex,'hex'));
  } catch(e) { 
    console.error('Erro ao verificar senha:', e);
    return false; 
  }
}

// Função para criar hash de senha
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, 32);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

console.log('=== VERIFICAÇÃO DE LOGIN ===\n');

// Listar todos os usuários
db.all('SELECT id, name, email, role, password_hash FROM usuarios', [], (err, users) => {
  if (err) {
    console.error('Erro ao buscar usuários:', err);
    db.close();
    return;
  }

  if (users.length === 0) {
    console.log('❌ Nenhum usuário encontrado no banco de dados!');
    console.log('\nCriando usuário padrão...\n');
    
    const defaultUsers = [
      { name: 'João Silva', email: 'joao@r10piaui.com', password: 'admin', role: 'admin' },
      { name: 'George Mendes', email: 'george@r10piaui.com', password: 'admin', role: 'admin' }
    ];

    defaultUsers.forEach(user => {
      const passwordHash = hashPassword(user.password);
      const createdAt = new Date().toISOString();
      
      db.run(
        'INSERT OR REPLACE INTO usuarios (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
        [user.name, user.email, passwordHash, user.role, createdAt],
        function(err) {
          if (err) {
            console.error(`❌ Erro ao criar usuário ${user.email}:`, err);
          } else {
            console.log(`✅ Usuário ${user.email} criado com sucesso (senha: ${user.password})`);
          }
        }
      );
    });

    setTimeout(() => {
      console.log('\n=== VERIFICAÇÃO CONCLUÍDA ===');
      db.close();
    }, 1000);
    
  } else {
    console.log(`Encontrados ${users.length} usuário(s):\n`);
    
    users.forEach(user => {
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Nome: ${user.name}`);
      console.log(`🔑 Role: ${user.role}`);
      
      // Testar senha "admin"
      const senhaCorreta = verifyPassword('admin', user.password_hash);
      if (senhaCorreta) {
        console.log(`✅ Senha "admin" está CORRETA para este usuário`);
      } else {
        console.log(`❌ Senha "admin" está INCORRETA para este usuário`);
        console.log(`   Atualizando senha para "admin"...`);
        
        const newHash = hashPassword('admin');
        db.run('UPDATE usuarios SET password_hash = ? WHERE id = ?', [newHash, user.id], (err) => {
          if (err) {
            console.error(`   ❌ Erro ao atualizar senha:`, err);
          } else {
            console.log(`   ✅ Senha atualizada com sucesso!`);
          }
        });
      }
      console.log('');
    });

    // Verificar se joao@r10piaui.com existe
    const joaoExiste = users.some(u => u.email === 'joao@r10piaui.com');
    if (!joaoExiste) {
      console.log('❌ Usuário joao@r10piaui.com não encontrado!');
      console.log('   Criando usuário...\n');
      
      const passwordHash = hashPassword('admin');
      const createdAt = new Date().toISOString();
      
      db.run(
        'INSERT INTO usuarios (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
        ['João Silva', 'joao@r10piaui.com', passwordHash, 'admin', createdAt],
        function(err) {
          if (err) {
            console.error('   ❌ Erro ao criar usuário:', err);
          } else {
            console.log('   ✅ Usuário joao@r10piaui.com criado com sucesso!');
          }
        }
      );
    }

    setTimeout(() => {
      console.log('\n=== TESTE DE LOGIN ===');
      console.log('\nPara testar, use:');
      console.log('Email: joao@r10piaui.com ou george@r10piaui.com');
      console.log('Senha: admin\n');
      
      db.close();
    }, 1000);
  }
});
