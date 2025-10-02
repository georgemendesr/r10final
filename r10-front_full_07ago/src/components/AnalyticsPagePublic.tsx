import React, { useEffect, useState } from 'react';
import { get as apiGet } from '../services/api';
import { BarChart3, TrendingUp, Users, Eye, Calendar, Instagram, Facebook, Globe, Activity } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MetricData {
  date: string;
  value: number;
}

interface SocialMetric {
  name: string;
  status: 'ok' | 'error';
  series?: MetricData[];
}

interface SocialAccount {
  id: string;
  username?: string;
  name?: string;
  followers?: number;
}

interface SocialData {
  account: SocialAccount;
  metrics: SocialMetric[];
}

interface SiteMetrics {
  pageviews: MetricData[];
  sessions: MetricData[];
  users: MetricData[];
}

interface TopPage {
  path: string;
  pageviews: number;
}

interface AnalyticsData {
  social: {
    instagram: SocialData;
    facebook: SocialData;
  };
  site: {
    metrics: SiteMetrics;
    topPages: TopPage[];
  };
}

const COLORS = {
  primary: '#ef4444',
  secondary: '#3b82f6', 
  accent: '#10b981',
  warning: '#f59e0b',
  instagram: '#e1306c',
  facebook: '#1877f2'
};

const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning, '#8b5cf6', '#f97316'];

const MetricCard: React.FC<{ 
  title: string; 
  value: string | number; 
  change?: string; 
  icon: React.ReactNode; 
  color: string;
  description?: string;
}> = ({ title, value, change, icon, color, description }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-full bg-gradient-to-r ${color}`}>
        {icon}
      </div>
      {change && (
        <div className={`flex items-center text-sm font-medium ${change.startsWith('+') ? 'text-green-600' : change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
          <TrendingUp size={16} className="mr-1" />
          {change}
        </div>
      )}
    </div>
    <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    {description && <p className="text-xs text-gray-500">{description}</p>}
  </div>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <Activity size={20} className="mr-2 text-red-500" />
      {title}
    </h3>
    <div className="h-80">
      {children}
    </div>
  </div>
);

const AnalyticsPagePublic: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [socialResponse, siteResponse] = await Promise.all([
        apiGet(`/social/analytics?days=${period}`).catch(() => null),
        apiGet(`/site/analytics?days=${period}`).catch(() => null)
      ]);

      const defaultSocial: AnalyticsData['social'] = { 
        instagram: { account: { id: '', username: '' }, metrics: [] }, 
        facebook: { account: { id: '', name: '' }, metrics: [] } 
      };
      
      const defaultSite: AnalyticsData['site'] = { 
        metrics: { pageviews: [], sessions: [], users: [] }, 
        topPages: [] 
      };

      setData({
        social: (socialResponse as any) || defaultSocial,
        site: (siteResponse as any) || defaultSite
      });
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md">
          <div className="text-red-500 mb-4">
            <BarChart3 size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao Carregar Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const getSocialMetrics = () => {
    const ig = data?.social.instagram;
    const fb = data?.social.facebook;
    
    const igReach = ig?.metrics.find(m => m.name === 'reach' && m.status === 'ok')?.series || [];
    const igViews = ig?.metrics.find(m => m.name === 'views' && m.status === 'ok')?.series || [];
    const fbImpressions = fb?.metrics.find(m => m.name === 'page_impressions' && m.status === 'ok')?.series || [];
    
    return {
      igReachTotal: igReach.reduce((sum, d) => sum + d.value, 0),
      igViewsTotal: igViews.reduce((sum, d) => sum + d.value, 0),
      fbImpressionsTotal: fbImpressions.reduce((sum, d) => sum + d.value, 0),
      igFollowers: ig?.account.followers || 0,
      fbFollowers: fb?.account.followers || 0
    };
  };

  const getSiteMetrics = () => {
    const site = data?.site.metrics;
    return {
      totalPageviews: site?.pageviews.reduce((sum, d) => sum + d.value, 0) || 0,
      totalSessions: site?.sessions.reduce((sum, d) => sum + d.value, 0) || 0,
      totalUsers: site?.users.reduce((sum, d) => sum + d.value, 0) || 0,
      avgSessionPages: site?.pageviews.length && site?.sessions.length 
        ? Math.round((site.pageviews.reduce((sum, d) => sum + d.value, 0) / site.sessions.reduce((sum, d) => sum + d.value, 0)) * 100) / 100
        : 0
    };
  };

  const socialMetrics = getSocialMetrics();
  const siteMetrics = getSiteMetrics();

  const combinedSocialData = data?.social.instagram.metrics.find(m => m.name === 'reach')?.series?.map((item, index) => ({
    date: item.date,
    Instagram: item.value,
    Facebook: data?.social.facebook.metrics.find(m => m.name === 'page_impressions')?.series?.[index]?.value || 0
  })) || [];

  const trafficSourcesData = [
    { name: 'Direto', value: 45, color: COLORS.primary },
    { name: 'Redes Sociais', value: 30, color: COLORS.instagram },
    { name: 'Busca Orgânica', value: 20, color: COLORS.accent },
    { name: 'Outros', value: 5, color: COLORS.warning }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 size={32} className="mr-3 text-red-500" />
                Analytics R10 Piauí
              </h1>
              <p className="text-gray-600 mt-2">Insights completos do site e redes sociais</p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={period} 
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={14}>Últimos 14 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={60}>Últimos 60 dias</option>
                <option value={90}>Últimos 90 dias</option>
              </select>
              <button 
                onClick={loadData}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
              >
                <Calendar size={16} className="mr-2" />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Seguidores Instagram"
            value={socialMetrics.igFollowers.toLocaleString()}
            change="+5.2%"
            icon={<Instagram size={24} className="text-white" />}
            color="from-pink-500 to-purple-600"
            description={`@${data?.social.instagram.account.username || 'r10piaui'}`}
          />
          <MetricCard
            title="Seguidores Facebook"
            value={socialMetrics.fbFollowers.toLocaleString()}
            change="+2.8%"
            icon={<Facebook size={24} className="text-white" />}
            color="from-blue-500 to-blue-700"
            description={data?.social.facebook.account.name || 'R10 Piauí'}
          />
          <MetricCard
            title="Pageviews"
            value={siteMetrics.totalPageviews.toLocaleString()}
            change="+12.3%"
            icon={<Eye size={24} className="text-white" />}
            color="from-green-500 to-emerald-600"
            description={`${period} dias`}
          />
          <MetricCard
            title="Usuários Únicos"
            value={siteMetrics.totalUsers.toLocaleString()}
            change="+8.7%"
            icon={<Users size={24} className="text-white" />}
            color="from-orange-500 to-red-600"
            description={`${period} dias`}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Site Traffic */}
          <ChartContainer title="Tráfego do Site">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.site.metrics.pageviews || []}>
                <defs>
                  <linearGradient id="pageviewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: any) => [value.toLocaleString(), 'Pageviews']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                />
                <Area type="monotone" dataKey="value" stroke={COLORS.primary} fillOpacity={1} fill="url(#pageviewsGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Social Media Reach */}
          <ChartContainer title="Alcance nas Redes Sociais">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedSocialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: any, name: string) => [value.toLocaleString(), name === 'Instagram' ? 'Reach' : 'Impressions']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                />
                <Line type="monotone" dataKey="Instagram" stroke={COLORS.instagram} strokeWidth={3} dot={{ fill: COLORS.instagram, strokeWidth: 2, r: 4 }} />
                <Line type="monotone" dataKey="Facebook" stroke={COLORS.facebook} strokeWidth={3} dot={{ fill: COLORS.facebook, strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Top Pages */}
          <ChartContainer title="Páginas Mais Visitadas">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.site.topPages.slice(0, 10) || []} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="path" 
                  stroke="#6b7280" 
                  fontSize={11}
                  width={120}
                  tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: any) => [value.toLocaleString(), 'Pageviews']}
                />
                <Bar dataKey="pageviews" fill={COLORS.accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Traffic Sources */}
          <ChartContainer title="Fontes de Tráfego">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficSourcesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {trafficSourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: any) => [`${value}%`, 'Porcentagem']}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Sessions vs Users */}
        <ChartContainer title="Sessões vs Usuários" className="col-span-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.site.metrics.sessions?.map((session, index) => ({
              date: session.date,
              Sessões: session.value,
              Usuários: data?.site.metrics.users?.[index]?.value || 0
            })) || []}>
              <defs>
                <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any, name: string) => [value.toLocaleString(), name]}
                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
              />
              <Area type="monotone" dataKey="Sessões" stackId="1" stroke={COLORS.secondary} fill="url(#sessionsGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="Usuários" stackId="2" stroke={COLORS.accent} fill="url(#usersGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default AnalyticsPagePublic;