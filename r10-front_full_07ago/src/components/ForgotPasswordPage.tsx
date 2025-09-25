import React, { useState } from 'react';
import { API_BASE_URL } from '../services/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setSent(true);
    } catch (e) {
      setError('Falha ao solicitar redefinição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Esqueci minha senha</h1>
        <p className="text-sm text-gray-600 mb-6">Informe seu email. Se existir uma conta, enviaremos um link de redefinição (aparece no log do servidor em dev).</p>
        {sent ? (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded">Se existir uma conta, o link foi enviado.</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-4 py-3 border rounded-lg mb-4" placeholder="voce@dominio.com" />
            {error && <div className="mb-3 p-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
            <button disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium disabled:bg-gray-400">{loading ? 'Enviando...' : 'Enviar link'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
