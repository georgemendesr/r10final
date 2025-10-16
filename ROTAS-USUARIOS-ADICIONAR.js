/**
 * ROTAS DE GERENCIAMENTO DE USUÁRIOS
 * 
 * Adicionar após a rota GET /api/users (linha ~1250) no server-api-simple.cjs
 * Antes da seção de Categories
 */

// Atualizar usuário (Admin only)
app.put('/api/users/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });
  
  const { name, email, role, avatar, password } = req.body || {};
  
  // Validar campos obrigatórios
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'campos obrigatórios: name, email, role' });
  }

  // Validar role
  if (!['admin', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'role inválida. Use: admin ou editor' });
  }

  // Se senha fornecida, validar
  if (password && String(password).length < 8) {
    return res.status(400).json({ error: 'senha muito curta (mínimo 8 caracteres)' });
  }

  // Montar query
  const updates = [String(name).trim(), String(email).toLowerCase().trim(), role, avatar || null];
  const sql = password 
    ? 'UPDATE usuarios SET name=?, email=?, role=?, avatar=?, password_hash=? WHERE id=?'
    : 'UPDATE usuarios SET name=?, email=?, role=?, avatar=? WHERE id=?';
  
  if (password) updates.push(hashPassword(String(password)));
  updates.push(id);

  db.run(sql, updates, function(err) {
    if (err) {
      if (String(err.message||'').includes('UNIQUE')) return res.status(409).json({ error: 'email já em uso' });
      return res.status(500).json({ error: 'erro de servidor' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'usuário não encontrado' });
    res.json({ 
      id: String(id), 
      name: String(name).trim(), 
      email: String(email).toLowerCase().trim(), 
      role, 
      avatar: avatar || null 
    });
  });
});

// Deletar usuário (Admin only) - não pode deletar a si mesmo
app.delete('/api/users/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const currentUserId = Number(req.user?.sub);
  
  if (!id) return res.status(400).json({ error: 'id inválido' });
  if (id === currentUserId) {
    return res.status(400).json({ error: 'não é possível deletar sua própria conta' });
  }
  
  // Verificar se não é o último admin
  db.get('SELECT COUNT(*) as c FROM usuarios WHERE role = "admin"', [], (err, row) => {
    if (err) return res.status(500).json({ error: 'erro de servidor' });
    
    db.get('SELECT role FROM usuarios WHERE id = ?', [id], (err2, user) => {
      if (err2) return res.status(500).json({ error: 'erro de servidor' });
      if (!user) return res.status(404).json({ error: 'usuário não encontrado' });
      
      // Se for admin e for o último, não permitir deletar
      if (user.role === 'admin' && (row?.c || 0) <= 1) {
        return res.status(400).json({ error: 'não é possível deletar o último administrador' });
      }
      
      // Deletar usuário
      db.run('DELETE FROM usuarios WHERE id = ?', [id], function(err3) {
        if (err3) return res.status(500).json({ error: 'erro de servidor' });
        if (this.changes === 0) return res.status(404).json({ error: 'usuário não encontrado' });
        
        // Revogar todos os refresh tokens do usuário
        db.run('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ?', 
          [new Date().toISOString(), id], 
          () => {
            res.json({ ok: true, message: 'usuário deletado com sucesso' });
          }
        );
      });
    });
  });
});
