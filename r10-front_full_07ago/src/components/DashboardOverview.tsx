import React from 'react';
import { 
  TrendingUp, Users, Eye, FileText, Instagram, Facebook, Globe, 
  Clock, ArrowUpRight, ArrowDownRight, Activity, BarChart3, Calendar, Star 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
  description?: string;
  loading?: boolean;
}

interface SocialInsights {
  facebook: { 
    followers: number; 
    engagement: number; 
    growth7d: number; 
    trend: { date: string; engagement: number }[]; 
    account?: { id?: string; name?: string } 
  };
  instagram: { 
    followers: number; 
    engagement: number; 
    growth7d: number; 
    trend: { date: string; engagement: number }[]; 
    account?: { id?: string; username?: string } 
  };
}

interface DashboardOverviewProps {
  socialInsights: SocialInsights | null;
  socialInsightsError: string | null;
  latestPosts: any[];
  mostRead: any[];
  loading: boolean;
  onTabChange: (tab: string) => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  color, 
  description,
  loading = false 
}) => {
  const getChangeIcon = () => {
    if (!change) return null;
    return changeType === 'positive' ? 
      <ArrowUpRight size={16} className="text-green-600" /> : 
      changeType === 'negative' ?
      <ArrowDownRight size={16} className="text-red-600" /> :
      <Activity size={16} className="text-gray-600" />;
  };

  const getChangeColor = () => {
    if (!change) return 'text-gray-600';
    return changeType === 'positive' ? 'text-green-600' : 
           changeType === 'negative' ? 'text-red-600' : 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${color} shadow-md group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center text-sm font-medium ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1">{change}</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1 uppercase tracking-wide">{title}</h3>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-20 mb-2"></div>
          {description && <div className="h-3 bg-gray-200 rounded w-full"></div>}
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold text-gray-900 mb-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </>
      )}
    </div>
  );
};

const QuickActionCard: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  color: string; 
  onClick: () => void;
}> = ({ title, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center p-6 bg-gradient-to-br ${color} rounded-xl border border-opacity-20 transition-all duration-200 group hover:shadow-lg hover:scale-105`}
  >
    <div className="mb-3 group-hover:scale-110 transition-transform duration-200">
      {icon}
    </div>
    <span className="text-sm font-semibold">{title}</span>
  </button>
);

const NewsCard: React.FC<{ 
  post: any; 
  featured?: boolean; 
  loading?: boolean;
}> = ({ post, featured = false, loading = false }) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-4 border border-gray-200 animate-pulse ${featured ? 'md:col-span-2' : ''}`}>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  const title = post.titulo || post.title || 'Sem título';
  const views = (post.views || post.visualizacoes || 0).toLocaleString();
  const time = new Date(post.dataPublicacao || post.publishedAt || Date.now()).toLocaleDateString('pt-BR');

  return (
    <div className={`bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group ${featured ? 'md:col-span-2 border-red-200 bg-gradient-to-r from-white to-red-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className={`font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 ${featured ? 'text-lg' : 'text-sm'}`}>
          {title}
        </h4>
        {featured && <Star size={16} className="text-yellow-500 flex-shrink-0 ml-2" />}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center">
          <Eye size={12} className="mr-1" />
          {views}
        </span>
        <span className="flex items-center">
          <Clock size={12} className="mr-1" />
          {time}
        </span>
      </div>
    </div>
  );
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  socialInsights,
  socialInsightsError,
  latestPosts,
  mostRead,
  loading,
  onTabChange
}) => {
  const metrics = [
    {
      title: 'Total de Posts',
      value: loading ? '-' : latestPosts.length,
      change: '+12%',
      changeType: 'positive' as const,
      icon: <FileText size={24} className="text-white" />,
      color: 'from-blue-500 to-blue-600',
      description: 'Este mês'
    },
    {
      title: 'Seguidores IG',
      value: loading ? '-' : socialInsights?.instagram.followers || 0,
      change: socialInsights ? `+${socialInsights.instagram.growth7d}%` : undefined,
      changeType: 'positive' as const,
      icon: <Instagram size={24} className="text-white" />,
      color: 'from-pink-500 to-purple-600',
      description: `@${socialInsights?.instagram.account?.username || 'r10piaui'}`
    },
    {
      title: 'Seguidores FB',
      value: loading ? '-' : socialInsights?.facebook.followers || 0,
      change: socialInsights ? `+${socialInsights.facebook.growth7d}%` : undefined,
      changeType: 'positive' as const,
      icon: <Facebook size={24} className="text-white" />,
      color: 'from-blue-600 to-blue-700',
      description: socialInsights?.facebook.account?.name || 'R10 Piauí'
    },
    {
      title: 'Engajamento',
      value: loading ? '-' : ((socialInsights?.instagram.engagement || 0) + (socialInsights?.facebook.engagement || 0)).toLocaleString(),
      change: '+8.5%',
      changeType: 'positive' as const,
      icon: <TrendingUp size={24} className="text-white" />,
      color: 'from-green-500 to-emerald-600',
      description: 'Últimos 7 dias'
    }
  ];

  const chartData = socialInsights?.instagram.trend?.map((item, index) => ({
    date: item.date,
    Instagram: item.engagement,
    Facebook: socialInsights?.facebook.trend?.[index]?.engagement || 0
  })) || [];

  const topCategories = [
    { name: 'Política', value: 35, color: '#ef4444' },
    { name: 'Esportes', value: 25, color: '#3b82f6' },
    { name: 'Policial', value: 20, color: '#f59e0b' },
    { name: 'Outros', value: 20, color: '#10b981' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
            <p className="text-red-100">Bem-vindo de volta! Aqui está o resumo do seu site.</p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-red-100">Última atualização</p>
              <p className="text-lg font-semibold">{new Date().toLocaleString('pt-BR')}</p>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            {...metric}
            loading={loading}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Activity size={24} className="mr-3 text-red-500" />
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            title="Nova Matéria"
            icon={<FileText size={32} className="text-white" />}
            color="from-red-500 to-red-600 text-white"
            onClick={() => onTabChange('materias')}
          />
          <QuickActionCard
            title="Gerenciar Mídia"
            icon={<Eye size={32} className="text-white" />}
            color="from-purple-500 to-purple-600 text-white"
            onClick={() => onTabChange('midia')}
          />
          <QuickActionCard
            title="Instagram"
            icon={<Instagram size={32} className="text-white" />}
            color="from-pink-500 to-purple-600 text-white"
            onClick={() => onTabChange('instagram')}
          />
          <QuickActionCard
            title="Analytics"
            icon={<BarChart3 size={32} className="text-white" />}
            color="from-blue-500 to-blue-600 text-white"
            onClick={() => onTabChange('analytics')}
          />
        </div>
      </div>

      {/* Social Insights & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Social Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <TrendingUp size={24} className="mr-3 text-green-500" />
              Performance Social
            </h3>
            {socialInsightsError && (
              <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                Erro nos dados
              </span>
            )}
          </div>
          
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="instagramGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e1306c" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#e1306c" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="facebookGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1877f2" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1877f2" stopOpacity={0.1}/>
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
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Instagram" 
                    stackId="1"
                    stroke="#e1306c" 
                    fill="url(#instagramGradient)" 
                    strokeWidth={2} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Facebook" 
                    stackId="2"
                    stroke="#1877f2" 
                    fill="url(#facebookGradient)" 
                    strokeWidth={2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Carregando dados...</p>
              </div>
            </div>
          )}
        </div>

        {/* Categories Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Globe size={24} className="mr-3 text-blue-500" />
            Categorias
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latest Posts & Most Read */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Posts */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText size={24} className="mr-3 text-red-500" />
              Últimas Publicações
            </h3>
            <button 
              onClick={() => onTabChange('materias')}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Ver todas →
            </button>
          </div>
          <div className="space-y-3">
            {(loading ? Array.from({ length: 4 }).map((_, i) => ({ id: `skeleton-${i}` })) : latestPosts.slice(0, 4)).map((post, index) => (
              <NewsCard 
                key={post.id || index} 
                post={post} 
                featured={index === 0}
                loading={loading}
              />
            ))}
          </div>
        </div>

        {/* Most Read */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Eye size={24} className="mr-3 text-green-500" />
              Mais Lidas
            </h3>
            <button 
              onClick={() => onTabChange('analytics')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Ver analytics →
            </button>
          </div>
          <div className="space-y-3">
            {(loading ? Array.from({ length: 4 }).map((_, i) => ({ id: `skeleton-most-${i}` })) : mostRead.slice(0, 4)).map((post, index) => (
              <NewsCard 
                key={post.id || index} 
                post={post} 
                loading={loading}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;