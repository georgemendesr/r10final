import React, { useEffect, useState } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
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
      await api.post("/auth/register", form as any);
      setShowForm(false);
      setForm({name:'',email:'',password:'',role:'editor'});
      load();
    } catch (e:any) { alert(e?.message||'Falha ao cadastrar'); }
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
          <p className="text-gray-600">Gerencie administradores e redatores.</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"><Plus className="w-4 h-4"/>Novo Usuário</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
          <input type="email" className="border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
          <input type="password" className="border rounded px-3 py-2" placeholder="Senha" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required />
          <select className="border rounded px-3 py-2" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value as any}))}>
            <option value="editor">Redator</option>
            <option value="admin">Admin</option>
          </select>
          <div className="md:col-span-4 flex justify-end gap-2">
            <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 rounded border">Cancelar</button>
            <button className="px-4 py-2 rounded bg-red-600 text-white">Salvar</button>
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
                  <button onClick={()=>handleDelete(u.id)} className="inline-flex items-center p-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors" title="Excluir"><Trash2 className="w-4 h-4"/></button>
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
