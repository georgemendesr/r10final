import React, { useEffect, useState } from 'react';
import { get as apiGet } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface SeriesPoint { date: string; value: number }
interface MetricEntry { name: string; period: string; status: 'ok'|'error'; series?: SeriesPoint[]; error?: any }

interface AnalyticsPayload {
  generatedAt: string;
  period: { since: string; until: string; days: number };
  instagram: { account: { id: string; username: string|null; followers: number|null; error?: any }, metrics: MetricEntry[] };
  facebook: { account: { id: string; name: string|null; followers: number|null; error?: any }, metrics: MetricEntry[] };
}

type Props = { initialDays?: number };

const AnalyticsPanel: React.FC<Props> = ({ initialDays = 30 }) => {
  const { isAuthenticated } = useAuth();
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!isAuthenticated) return;
    setLoading(true); setError(null);
    try {
      const json = await apiGet<AnalyticsPayload>(`/social/analytics?days=${days}`);
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar analytics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days, isAuthenticated]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-lg">Analytics (Instagram + Facebook)</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Período:</label>
          <select value={days} onChange={e=>setDays(parseInt(e.target.value))} className="border rounded px-2 py-1">
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>
          <button onClick={load} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Atualizar</button>
        </div>
      </div>

      {loading && <div className="p-4 bg-white rounded shadow">Carregando…</div>}
      {error && <div className="p-4 bg-white rounded shadow text-red-600">{error}</div>}

      {data && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow border border-gray-100">
            <h4 className="text-base font-semibold mb-1">Instagram</h4>
            <p className="text-xs text-gray-600 mb-3">@{data.instagram.account.username || '—'} · Seguidores: {data.instagram.account.followers ?? '—'}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {data.instagram.metrics.map(m => (
                <div key={`ig-${m.name}`} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-sm">{m.name}</strong>
                    <span className={`text-xs px-2 py-0.5 rounded ${m.status==='ok'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{m.status}</span>
                  </div>
                  {m.status==='ok' ? (
                    <>
                      <div className="text-xs text-gray-500 mb-2">{m.series?.length || 0} pontos · período: {m.period}</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead><tr><th className="text-left pr-4">Data</th><th className="text-left">Valor</th></tr></thead>
                          <tbody>
                            {(m.series || []).map(p => (
                              <tr key={p.date} className="border-t"><td className="pr-4 py-1">{p.date}</td><td className="py-1">{p.value}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-600">Falha: {typeof m.error==='string'? m.error : JSON.stringify(m.error)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow border border-gray-100">
            <h4 className="text-base font-semibold mb-1">Facebook</h4>
            <p className="text-xs text-gray-600 mb-3">{data.facebook.account.name || '—'} · Seguidores: {data.facebook.account.followers ?? '—'}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {data.facebook.metrics.map(m => (
                <div key={`fb-${m.name}`} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-sm">{m.name}</strong>
                    <span className={`text-xs px-2 py-0.5 rounded ${m.status==='ok'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{m.status}</span>
                  </div>
                  {m.status==='ok' ? (
                    <>
                      <div className="text-xs text-gray-500 mb-2">{m.series?.length || 0} pontos · período: {m.period}</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead><tr><th className="text-left pr-4">Data</th><th className="text-left">Valor</th></tr></thead>
                          <tbody>
                            {(m.series || []).map(p => (
                              <tr key={p.date} className="border-t"><td className="pr-4 py-1">{p.date}</td><td className="py-1">{p.value}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-600">Falha: {typeof m.error==='string'? m.error : JSON.stringify(m.error)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-gray-500">Gerado em {new Date(data.generatedAt).toLocaleString()} · Período: {data.period.since} a {data.period.until}</div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
