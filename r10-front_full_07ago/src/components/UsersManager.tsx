import React, { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Shield, Edit2 } from 'lucide-react';
import * as api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type User = { id: string; name: string; email: string; role: 'admin'|'editor'; avatar?: string|null; createdAt?: string };

const UsersManager: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<{name:string;email:string;password:string;role:'admin'|'editor'}>({name:'',email:'',password:'',role:'editor'});

  async function load() {
    try {
      setLoading(true); setError(null);
      const data = await api.get<{items:User[]}>("/users");
      setItems(data.items || []);
    } catch (e:any) { setError(e?.message||'Falha ao listar usuários'); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ if (isAdmin) load(); },[isAdmin]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingUser) {
        // Atualizar usuário existente
        await api.put(`/users/${editingUser.id}`, {
          name: form.name,
          email: form.email,
          role: form.role,
          ...(form.password ? { password: form.password } : {}) // Senha opcional na edição
        });
      } else {
        // Criar novo usuário
        await api.post("/auth/register", form as any);
      }
      setShowForm(false);
      setEditingUser(null);
      setForm({name:'',email:'',password:'',role:'editor'});
      load();
    } catch (e:any) { alert(e?.message || (editingUser ? 'Falha ao atualizar' : 'Falha ao cadastrar')); }
  }

  function handleEdit(u: User) {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '', // Deixa em branco na edição
      role: u.role
    });
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingUser(null);
    setForm({name:'',email:'',password:'',role:'editor'});
  }

  async function handleRoleChange(id: string, role: 'admin'|'editor') {
    try {
      await api.put(`/users/${id}`, { role });
      load();
    } catch (e:any) { alert(e?.message||'Falha ao atualizar papel'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este usuário?')) return;
    try {
      await api.del(`/users/${id}`);
      load();
    } catch (e:any) { alert(e?.message||'Falha ao excluir'); }
  }

  if (!isAdmin) {
    return (
      <div className="p-6 bg-white rounded-xl border">
        <div className="text-red-600 font-semibold">Acesso restrito a administradores.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-6 h-6"/>Usuários</h2>
          <p className="text-gray-600">Gerencie administradores e redatores. Você pode editar nome, email e até mesmo o login.</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"><Plus className="w-4 h-4"/>Novo Usuário</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            {editingUser && (
              <span className="text-sm text-gray-500">ID: {editingUser.id}</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input 
                className="w-full border rounded px-3 py-2" 
                placeholder="Ex: João Silva" 
                value={form.name} 
                onChange={e=>setForm(f=>({...f,name:e.target.value}))} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login)</label>
              <input 
                type="email" 
                className="w-full border rounded px-3 py-2" 
                placeholder="Ex: joao@r10piaui.com" 
                value={form.email} 
                onChange={e=>setForm(f=>({...f,email:e.target.value}))} 
                required 
              />
              <p className="text-xs text-gray-500 mt-1">Este email será usado como login</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha {editingUser && <span className="text-gray-500">(deixe em branco para manter)</span>}
              </label>
              <input 
                type="password" 
                className="w-full border rounded px-3 py-2" 
                placeholder={editingUser ? "Deixe em branco para não alterar" : "Mínimo 8 caracteres"} 
                value={form.password} 
                onChange={e=>setForm(f=>({...f,password:e.target.value}))} 
                required={!editingUser}
                minLength={8}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Papel/Permissão</label>
              <select 
                className="w-full border rounded px-3 py-2" 
                value={form.role} 
                onChange={e=>setForm(f=>({...f,role:e.target.value as any}))}
              >
                <option value="editor">Redator (pode criar/editar matérias)</option>
                <option value="admin">Admin (acesso total ao sistema)</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button 
              type="button" 
              onClick={handleCancelForm} 
              className="px-4 py-2 rounded border hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
            >
              {editingUser ? <><Edit2 className="w-4 h-4"/>Atualizar</> : <><Plus className="w-4 h-4"/>Criar</>}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Papel</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-base text-gray-900">{u.name}</td>
                <td className="px-6 py-3 text-base text-gray-700">{u.email}</td>
                <td className="px-6 py-3">
                  <select value={u.role} onChange={e=>handleRoleChange(u.id, e.target.value as any)} className="border rounded px-2 py-1">
                    <option value="editor">Redator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-3 flex items-center gap-2">
                  <button 
                    onClick={()=>handleEdit(u)} 
                    className="inline-flex items-center p-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors" 
                    title="Editar nome, email e login"
                  >
                    <Edit2 className="w-4 h-4"/>
                  </button>
                  <button 
                    onClick={()=>handleDelete(u.id)} 
                    className="inline-flex items-center p-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors" 
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="px-6 py-6 text-center text-gray-500" colSpan={4}>Nenhum usuário cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersManager;
