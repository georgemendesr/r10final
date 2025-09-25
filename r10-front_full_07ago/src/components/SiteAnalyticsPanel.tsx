import React, { useEffect, useState } from 'react';
import { get as apiGet } from '../services/api';

interface Point { date: string; value: number }
interface TopPage { path: string; pageviews: number }
interface SiteAnalyticsPayload {
  generatedAt: string;
  period: { since: string; until: string; days: number };
  source: 'first-party';
  metrics: { pageviews: Point[]; sessions: Point[]; users: Point[] };
  topPages: TopPage[];
}

const SiteAnalyticsPanel: React.FC<{ days: number }> = ({ days }) => {
  const [data, setData] = useState<SiteAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const json = await apiGet<SiteAnalyticsPayload>(`/site/analytics?days=${days}`);
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar Site Analytics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 text-lg">Site (Pageviews, Sessões, Usuários)</h3>
      {loading && <div className="p-3 bg-white rounded border">Carregando…</div>}
      {error && <div className="p-3 bg-white rounded border text-red-600">{error}</div>}
      {data && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded border p-4">
            <h4 className="font-medium mb-2">Séries Diárias</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left pr-3">Data</th>
                    <th className="text-right pr-3">Pageviews</th>
                    <th className="text-right pr-3">Sessões</th>
                    <th className="text-right">Usuários</th>
                  </tr>
                </thead>
                <tbody>
                  {data.metrics.pageviews.map((p, i) => (
                    <tr key={p.date} className="border-t">
                      <td className="py-1 pr-3">{p.date}</td>
                      <td className="py-1 pr-3 text-right">{p.value}</td>
                      <td className="py-1 pr-3 text-right">{data.metrics.sessions[i]?.value ?? 0}</td>
                      <td className="py-1 text-right">{data.metrics.users[i]?.value ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded border p-4">
            <h4 className="font-medium mb-2">Páginas Mais Vistas</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left">Path</th>
                    <th className="text-right">Pageviews</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((t) => (
                    <tr key={t.path} className="border-t">
                      <td className="py-1 pr-3">{t.path}</td>
                      <td className="py-1 text-right">{t.pageviews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 col-span-full">Fonte: {data.source} · Período {data.period.since} a {data.period.until}</div>
        </div>
      )}
    </div>
  );
};

export default SiteAnalyticsPanel;
