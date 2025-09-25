import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const token = params.get('token') || '';

  useEffect(()=>{ if (!token) setError('Token inválido'); },[token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError('Senha deve ter ao menos 6 caracteres');
    if (password !== confirm) return setError('As senhas não coincidem');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Falha ao redefinir');
      }
      setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Falha ao redefinir');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Redefinir senha</h1>
        {done ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded">Senha redefinida com sucesso.</div>
            <Link to="/login" className="inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Ir para login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg mb-3" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full px-4 py-3 border rounded-lg mb-3" />
            {error && <div className="mb-3 p-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium">Redefinir</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
