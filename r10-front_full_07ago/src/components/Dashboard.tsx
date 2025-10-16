import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, FileText, Image, Calendar, BarChart3, Settings, 
  Plus, Users, TrendingUp, Clock, Eye, Bell, MessageSquare,
  Play, Share2, HelpCircle, Target, Edit3, MapPin, Star,
  Activity, CheckCircle, Heart, Camera, Mic, Pencil, Trash2, ImageIcon, PlayCircle, Edit, Trash, CheckSquare,
  ArrowUpRight, ArrowDownRight, Filter, Download, RefreshCw, Layout, Instagram
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardHeader from './DashboardHeader';
import PostsManager from './PostsManager';
import MediaGallery from './MediaGallery';
import InstagramCardGenerator from './InstagramCardGenerator';
import InstagramInsightsComplete from './InstagramInsightsComplete';
import LayoutManager from './LayoutManager';
import { useAuth } from '../contexts/AuthContext';
import type { Banner } from '../services/bannersApi';
import * as bannersApi from '../services/bannersApi';
import { get as apiGet } from '../services/api';
import BannerForm from './BannerForm';
import CategoryManager from './CategoryManager';
import instagramAutomation from '../services/instagramAutomation';
import { fetchPostsPage, getMostRead, type Post } from '../services/postsService';
import UsersManager from './UsersManager';
import AnalyticsPanel from './AnalyticsPanel';
import SiteAnalyticsPanel from './SiteAnalyticsPanel';
import DashboardOverview from './DashboardOverview';
import DetailedAnalytics from './DetailedAnalytics';
import SettingsPage from './Settings';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [instagramSubTab, setInstagramSubTab] = useState<'insights' | 'generator'>('insights');
  const [realtimeUsers, setRealtimeUsers] = useState(0);
  const [notifications, setNotifications] = useState(3);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('7d');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [socialInsights, setSocialInsights] = useState<{
    facebook: { followers: number; engagement: number; growth7d: number; trend: { date: string; engagement: number }[]; account?: { id?: string; name?: string } };
    instagram: { followers: number; engagement: number; growth7d: number; trend: { date: string; engagement: number }[]; account?: { id?: string; username?: string } };
  } | null>(null);
  const [socialInsightsError, setSocialInsightsError] = useState<string | null>(null);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | undefined>();
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [mostRead, setMostRead] = useState<Post[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [errorOverview, setErrorOverview] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'editor';
  const canSeeInsights = !!user; // qualquer usuário autenticado
  
  // Usuários do tipo 'editor' (redação) NÃO podem acessar: Layout, Banner Ads, Categorias, Usuários
  const canAccessLayout = isAdmin;
  const canAccessBanners = isAdmin;
  const canAccessCategories = isAdmin;
  const canAccessUsers = isAdmin;

  // Detectar aba ativa pela URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/admin/materias') {
      setActiveTab('materias');
    } else if (path === '/admin/configuracoes') {
      setActiveTab('configuracoes');
    } else if (path === '/admin/usuarios') {
      if (isAdmin) {
        setActiveTab('usuarios');
      } else {
        setActiveTab('overview');
        navigate('/admin');
      }
    } else if (path === '/admin') {
      // Detectar parâmetro tab na URL para compatibilidade
      const tabParam = searchParams.get('tab');
      if (tabParam && ['overview', 'midia', 'layout', 'instagram', 'agendamento', 'banners', 'categorias', 'analytics', 'advanced-analytics'].includes(tabParam)) {
        // Verificar permissões antes de permitir acesso às abas restritas
        const restrictedTabs = {
          'layout': canAccessLayout,
          'banners': canAccessBanners,
          'categorias': canAccessCategories
        };
        
        if (tabParam in restrictedTabs && !restrictedTabs[tabParam as keyof typeof restrictedTabs]) {
          // Usuário sem permissão tentou acessar aba restrita - redirecionar
          setActiveTab('overview');
          navigate('/admin');
        } else {
          setActiveTab(tabParam);
        }
      } else {
        setActiveTab('overview');
      }
    }

    // Inicializar Instagram Automation
    instagramAutomation.requestNotificationPermission();
  }, [location.pathname, searchParams, isAdmin, navigate]);

  // Carregar dados reais para overview
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoadingOverview(true);
        setErrorOverview(null);
        const [paged, top] = await Promise.all([
          fetchPostsPage({ page: 1, limit: 20 }),
          getMostRead(5)
        ]);
        if (!mounted) return;
        setLatestPosts(paged.items);
        setMostRead(top);
        // Aproximação: usuários online ~ posts de hoje * 10 (placeholder até termos endpoint)
        const today = new Date().toDateString();
        const todayCount = paged.items.filter(p => new Date(p.dataPublicacao || p.publishedAt || '').toDateString() === today).length;
        setRealtimeUsers(Math.max(3, todayCount * 10));
      } catch (e: any) {
        if (!mounted) return;
        setErrorOverview(e?.message || 'Falha ao carregar dados');
      } finally {
        if (mounted) setLoadingOverview(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Carregar banners (API real)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const items = await bannersApi.listBanners();
        if (mounted) setBanners(items);
      } catch (_) {
        if (mounted) setBanners([]);
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Carregar insights sociais (Facebook/Instagram) para Overview (apenas admin/editor logado)
  useEffect(() => {
    let mounted = true;
    if (!canSeeInsights) {
      setSocialInsights(null);
      setSocialInsightsError('Faça login para ver os insights.');
      return () => { mounted = false; };
    }
    async function loadInsights() {
      try {
        setSocialInsightsError(null);
        const data = await apiGet('/social/insights');
        if (!mounted) return;
        setSocialInsights(data as any);
      } catch (e: any) {
        if (!mounted) return;
        const status = e?.status;
        if (status === 401) {
          setSocialInsightsError('Sessão expirada ou não autenticado. Faça login novamente.');
        } else if (status === 501) {
          setSocialInsightsError('Insights: configurar IG_BUSINESS_ID/FB_PAGE_ID/IG_ACCESS_TOKEN no backend (.env).');
        } else {
          setSocialInsightsError('Erro ao carregar insights. Tente novamente em instantes.');
        }
      }
    }
    loadInsights();
    const id = setInterval(loadInsights, 60_000);
    return () => { mounted = false; clearInterval(id); };
  }, [canSeeInsights]);

  // Estatísticas derivadas simples (até termos analytics dedicado)
  const stats = React.useMemo(() => {
    const today = new Date().toDateString();
    const todayPosts = latestPosts.filter(p => new Date(p.dataPublicacao || p.publishedAt || '').toDateString() === today);
    const todayViews = todayPosts.reduce((sum, p) => sum + (p.views || p.visualizacoes || 0), 0);
    const postsPublished = todayPosts.length;
    const engagementRate = mostRead.length ? Math.min(12, 5 + mostRead.length) : 7.5;
    return {
      todayViews,
      todayUsers: realtimeUsers,
      postsPublished,
      engagementRate
    };
  }, [latestPosts, mostRead, realtimeUsers]);

  const recentActivity = [
    {
      id: 1,
      type: 'post',
      title: 'Governador anuncia investimento em infraestrutura',
      author: 'João Silva',
      time: '2 min',
      status: 'published',
      views: 2543,
      category: 'política',
      position: 'supermanchete'
    },
    {
      id: 2,
      type: 'post',
      title: 'Festival de Pedro II bate recorde de visitantes',
      author: 'Maria Santos',
      time: '15 min',
      status: 'scheduled',
      category: 'cultura',
      position: 'destaque-principal'
    },
    {
      id: 3,
      type: 'media',
      title: 'Entrevista exclusiva com prefeito de Piripiri',
      author: 'Carlos Oliveira',
      time: '1h',
      status: 'processing',
      category: 'r10-play'
    }
  ];

  const quickStats = [
    { label: 'Hoje', value: stats.todayViews.toLocaleString(), sublabel: 'visualizações', color: 'from-blue-500 to-cyan-400', icon: Eye },
    { label: 'Agora', value: realtimeUsers.toLocaleString(), sublabel: 'usuários online', color: 'from-green-500 to-emerald-400', icon: Users },
    { label: 'Hoje', value: stats.postsPublished.toString(), sublabel: 'matérias publicadas', color: 'from-purple-500 to-pink-400', icon: FileText },
    { label: 'Engajamento', value: `${stats.engagementRate.toFixed(1)}%`, sublabel: 'taxa média', color: 'from-orange-500 to-red-400', icon: Heart }
  ];

  const categories = [
    { name: 'Política', count: 12, color: 'bg-red-500', icon: Edit3 },
    { name: 'Esportes', count: 8, color: 'bg-green-500', icon: MapPin },
    { name: 'Entretenimento', count: 3, color: 'bg-orange-500', icon: Star }
  ];

  // Dados simulados para matérias
  const materias = [
    {
      id: 1,
      title: "Nova Política de Transporte Público em Teresina Promete Revolucionar Mobilidade Urbana",
      subtitle: "Sistema integrado de ônibus e metrô será implementado em 2024 com investimento de R$ 500 milhões",
      author: "Redação R10 Piauí",
      category: "POLÍTICA",
      status: "published",
      publishDate: "24/01/2025",
      views: 2543,
      position: "supermanchete",
      chapéu: "EXCLUSIVO"
    },
    {
      id: 2,
      title: "Governador anuncia investimento em infraestrutura",
      subtitle: "Projeto de R$ 200 milhões para melhorar estradas do interior",
      author: "João Silva",
      category: "POLÍTICA",
      status: "draft",
      publishDate: "23/01/2025",
      views: 0,
      position: "destaque-principal",
      chapéu: "ÚLTIMA HORA"
    },
    {
      id: 3,
      title: "Festival de Pedro II bate recorde de visitantes",
      subtitle: "Evento cultural atrai mais de 50 mil pessoas em três dias",
      author: "Maria Santos",
      category: "CULTURA",
      status: "scheduled",
      publishDate: "25/01/2025",
      views: 0,
      position: "destaque-secundário",
      chapéu: "CULTURA"
    },
    {
      id: 4,
      title: "Entrevista exclusiva com prefeito de Piripiri",
      subtitle: "Gestor fala sobre projetos para 2024 e desafios da administração",
      author: "Carlos Oliveira",
      category: "ENTREVISTAS",
      status: "published",
      publishDate: "22/01/2025",
      views: 1897,
      position: "destaque-principal",
      chapéu: "EXCLUSIVO"
    }
  ];

  // Dados simulados para Analytics
  const viewsData = [
    { name: 'Seg', views: 4200, users: 1200, readTime: 3.2 },
    { name: 'Ter', views: 5100, users: 1450, readTime: 3.8 },
    { name: 'Qua', views: 4800, users: 1380, readTime: 3.5 },
    { name: 'Qui', views: 6200, users: 1650, readTime: 4.1 },
    { name: 'Sex', views: 7800, users: 2100, readTime: 3.9 },
    { name: 'Sáb', views: 5900, users: 1750, readTime: 4.3 },
    { name: 'Dom', views: 4500, users: 1300, readTime: 4.8 }
  ];

  const trafficSources = [
    { name: 'Busca Orgânica', value: 45, color: '#10B981' },
    { name: 'Direto', value: 30, color: '#3B82F6' },
    { name: 'Redes Sociais', value: 15, color: '#8B5CF6' },
    { name: 'Referência', value: 10, color: '#F59E0B' }
  ];

  const topArticles = mostRead.map(p => ({
    title: p.titulo,
    views: (p.views || p.visualizacoes || 0),
    readTime: '-',
    engagement: 7.0
  }));

  const categoryPerformance = [
    { name: 'Política', articles: 45, views: 125000, engagement: 8.2 },
    { name: 'Economia', articles: 32, views: 89000, engagement: 7.1 },
    { name: 'Esportes', articles: 28, views: 76000, engagement: 9.3 },
    { name: 'Cultura', articles: 22, views: 54000, engagement: 6.8 },
    { name: 'Saúde', articles: 18, views: 42000, engagement: 7.9 }
  ];

  const handleSaveBanner = async (_banner: Banner) => {
    try {
      const items = await bannersApi.listBanners();
      setBanners(items);
    } finally {
      setShowBannerForm(false);
      setEditingBanner(undefined);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setShowBannerForm(true);
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;
    await bannersApi.deleteBanner(bannerId);
    const items = await bannersApi.listBanners();
    setBanners(items);
  };

  const PublicidadeContent = () => {
  const stats = bannersApi.computeBannerStats(banners);
  const positions = bannersApi.getAvailablePositions();

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Publicidade</h2>
            <p className="text-gray-600">Gerencie banners, anúncios e campanhas publicitárias</p>
          </div>
          <button
            onClick={() => setShowBannerForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Banner</span>
          </button>
        </div>

                 {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-blue-100 text-base">Total de Impressões</p>
                 <p className="text-2xl font-bold">{stats.impressoes.toLocaleString()}</p>
               </div>
               <Eye className="w-8 h-8 text-blue-200" />
             </div>
           </div>
           
           <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-green-100 text-base">Total de Cliques</p>
                 <p className="text-2xl font-bold">{stats.cliques.toLocaleString()}</p>
               </div>
               <Target className="w-8 h-8 text-green-200" />
             </div>
           </div>
           
           <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-purple-100 text-base">CTR Médio</p>
                 <p className="text-2xl font-bold">{stats.ctr}%</p>
               </div>
               <Activity className="w-8 h-8 text-purple-200" />
             </div>
           </div>
         </div>

        {/* Banners List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Banners Ativos</h3>
            <p className="text-gray-600 text-base">Gerencie todos os banners publicitários do site</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Banner</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Posição</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banners.map((banner) => {
                  const ctr = banner.impressoesAtuais > 0 ? (banner.cliquesAtuais / banner.impressoesAtuais * 100).toFixed(2) : '0.00';
                  const position = positions.find(p => p.value === banner.posicao);
                  
                  return (
                    <tr key={banner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {banner.tipo === 'imagem' && banner.imagem ? (
                            <img src={banner.imagem} alt={banner.titulo} className="w-16 h-10 object-cover rounded mr-3" />
                          ) : (
                            <div className="w-16 h-10 bg-gray-200 rounded mr-3 flex items-center justify-center">
                              <Target className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-base font-medium text-gray-900">{banner.titulo}</div>
                            <div className="text-base text-gray-500">{banner.tamanho} • {banner.tipo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">{banner.cliente}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {position?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          banner.status === 'ativo' ? 'bg-green-100 text-green-800' :
                          banner.status === 'pausado' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {banner.status === 'ativo' ? 'Ativo' : 
                           banner.status === 'pausado' ? 'Pausado' : 'Agendado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                        <div>
                          <div>{banner.impressoesAtuais.toLocaleString()} impressões</div>
                          <div className="text-gray-500">{banner.cliquesAtuais} cliques • {ctr}% CTR</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium space-x-2">
                        <button
                          onClick={() => handleEditBanner(banner)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Positions Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Posições Disponíveis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {positions.map((position) => {
              const positionBanners = banners.filter(b => b.posicao === position.value && b.status === 'ativo');
              return (
                <div key={position.value} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{position.label}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      positionBanners.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {positionBanners.length} ativo{positionBanners.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{position.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const Sidebar = () => (
    <div className="w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white h-fit rounded-lg shadow-xl">
      <div className="p-4">
        {/* Logo - Compacto */}
        <div className="flex items-center space-x-3 mb-6">
          <img 
            src="/imagens/logor10.png"
            alt="R10 Piauí"
            className="h-8 w-auto"
          />
          <div>
            <h1 className="font-bold text-lg">R10 Painel</h1>
            <p className="text-gray-400 text-sm">Editorial</p>
          </div>
        </div>

        {/* User Info - Compacto */}
        <div className="bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700">
          <div className="flex items-center space-x-2">
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"} 
              alt="Avatar" 
              className="w-8 h-8 rounded-lg border border-red-500"
            />
            <div>
              <p className="font-medium text-white text-base">{user?.name || 'Usuário'}</p>
              <p className="text-sm text-gray-400">
                {user?.role === 'admin' ? 'Admin' : 
                 user?.role === 'editor' ? 'Editor' : 
                 user?.role === 'reporter' ? 'Reporter' : 'User'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - Completo mas compacto */}
        <nav className="space-y-1">
          {[ 
            { id: 'overview', label: 'Dashboard', icon: BarChart3, badge: null, url: '/admin' },
            { id: 'materias', label: 'Matérias', icon: FileText, badge: null, url: '/admin/materias' },
            { id: 'midia', label: 'Mídia', icon: Image, badge: null, url: '/admin?tab=midia' },
            ...(canAccessLayout ? [{ id: 'layout', label: 'Layout', icon: Layout, badge: null, url: '/admin?tab=layout' }] : []),
            { id: 'instagram', label: 'Instagram', icon: Camera, badge: null, url: '/admin?tab=instagram' },
            { id: 'agendamento', label: 'Agenda', icon: Calendar, badge: null, url: '/admin?tab=agendamento' },
            ...(canAccessBanners ? [{ id: 'banners', label: 'Banner Ads', icon: Target, badge: null, url: '/admin?tab=banners' }] : []),
            ...(canAccessCategories ? [{ id: 'categorias', label: 'Categorias', icon: Settings, badge: null, url: '/admin?tab=categorias' }] : []),
            { id: 'analytics', label: 'Analytics', icon: TrendingUp, badge: null, url: '/admin?tab=analytics' },
            { id: 'advanced-analytics', label: 'Analytics Avançados', icon: BarChart3, badge: 'NEW', url: '/admin?tab=advanced-analytics' },
            ...(canAccessUsers ? [{ id: 'usuarios', label: 'Usuários', icon: Users, badge: null, url: '/admin/usuarios' }] : []),
            { id: 'configuracoes', label: 'Configurações', icon: Settings, badge: null, url: '/admin?tab=configuracoes' }
          ].map(item => (
            <Link
              key={item.id}
              to={item.url}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-base ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Quick Action - Compacto */}
        <div className="mt-3">
          <Link to="/admin/nova-materia" className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 px-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-base">
            <Plus className="w-5 h-5" />
            <span>Nova Matéria</span>
          </Link>
        </div>

        {/* System Status - Mais compacto */}
        <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Sistema Online</span>
          </div>
        </div>
      </div>
    </div>
  );

  const OverviewContent = () => {
    return (
      <DashboardOverview
        socialInsights={socialInsights}
        socialInsightsError={socialInsightsError}
        latestPosts={latestPosts}
        mostRead={mostRead}
        loading={loadingOverview}
        onTabChange={setActiveTab}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader notifications={notifications} />
      
      {/* Navegação Mobile - Substitui sidebar no mobile */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1250px] mx-auto px-4">
          <div className="flex overflow-x-auto py-3 space-x-2 scrollbar-hide">
            {[
              { id: 'overview', label: 'Dashboard', icon: BarChart3, url: '/admin' },
              { id: 'materias', label: 'Matérias', icon: FileText, url: '/admin/materias' },
              { id: 'midia', label: 'Mídia', icon: Image, url: '/admin?tab=midia' },
              ...(canAccessLayout ? [{ id: 'layout', label: 'Layout', icon: Layout, url: '/admin?tab=layout' }] : []),
              { id: 'instagram', label: 'Instagram', icon: Camera, url: '/admin?tab=instagram' },
              { id: 'agendamento', label: 'Agenda', icon: Calendar, url: '/admin?tab=agendamento' },
            ].map(item => (
              <Link
                key={item.id}
                to={item.url}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Container responsivo com sidebar colapsível no mobile */}
      <div className="max-w-[1250px] mx-auto px-4 lg:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar - oculta no mobile, mostra no desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Sidebar />
          </div>
          
          {/* Conteúdo principal - full width no mobile */}
          <div className="flex-1 min-w-0 w-full">
            {activeTab === 'overview' && <OverviewContent />}
            {activeTab === 'materias' && <PostsManager />}
            {activeTab === 'usuarios' && canAccessUsers && <UsersManager />}
            {activeTab === 'configuracoes' && <SettingsPage />}
          {activeTab === 'midia' && <MediaGallery />}
          {activeTab === 'layout' && canAccessLayout && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Layout da Home</h2>
                  <p className="text-gray-600 mt-1 text-sm">Organize as seções da página inicial</p>
                </div>
              </div>
              <LayoutManager />
            </div>
          )}
          {activeTab === 'banners' && canAccessBanners && (
            <PublicidadeContent />
          )}
          {activeTab === 'instagram' && (
            <div className="space-y-6">
              {/* Instagram Sub-tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setInstagramSubTab('insights')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      instagramSubTab === 'insights'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    📊 Insights & Analytics
                  </button>
                  <button
                    onClick={() => setInstagramSubTab('generator')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      instagramSubTab === 'generator'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🎨 Gerador de Cards
                  </button>
                </div>
              </div>

              {/* Instagram Content */}
              {instagramSubTab === 'insights' ? <InstagramInsightsComplete /> : <InstagramCardGenerator />}
            </div>
          )}
          {activeTab === 'agendamento' && (
            <div className="space-y-6">
              {/* Scheduling Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Agendamento de Publicações</h3>
                  <Link 
                    to="/admin/nova-materia" 
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agendar Nova Matéria</span>
                  </Link>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl p-4 shadow-lg">
                    <h4 className="font-semibold text-white mb-1">Hoje</h4>
                    <p className="text-2xl font-bold text-white">3</p>
                    <p className="text-sm text-white/80">publicações</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl p-4 shadow-lg">
                    <h4 className="font-semibold text-white mb-1">Esta Semana</h4>
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-sm text-white/80">agendadas</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl p-4 shadow-lg">
                    <h4 className="font-semibold text-white mb-1">Próximo Mês</h4>
                    <p className="text-2xl font-bold text-white">28</p>
                    <p className="text-sm text-white/80">planejadas</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-red-400 rounded-xl p-4 shadow-lg">
                    <h4 className="font-semibold text-white mb-1">Rascunhos</h4>
                    <p className="text-2xl font-bold text-white">7</p>
                    <p className="text-xs text-white/80">pendentes</p>
                  </div>
                </div>
              </div>

              {/* Calendar View */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Calendário de Publicações</h3>
                
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-semibold text-gray-700">Janeiro 2024</h4>
                  <div className="flex space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <ArrowDownRight className="w-4 h-4 text-gray-600 rotate-180" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <ArrowDownRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-lg">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 6; // Ajuste para começar no domingo
                    const hasPost = [2, 5, 8, 12, 15, 18, 22, 25, 28].includes(day);
                    const isToday = day === 15;
                    
                    return (
                      <div key={i} className={`
                        min-h-[80px] p-2 border border-gray-100 rounded-lg relative cursor-pointer hover:bg-gray-50 transition-colors
                        ${isToday ? 'bg-red-50 border-red-200' : ''}
                      `}>
                        {day > 0 && day <= 31 && (
                          <>
                            <span className={`text-sm font-medium ${isToday ? 'text-red-600' : 'text-gray-700'}`}>
                              {day}
                            </span>
                            {hasPost && (
                              <div className="mt-1">
                                <div className="w-full bg-blue-500 text-white text-xs px-2 py-1 rounded mb-1 truncate">
                                  Matéria 1
                                </div>
                                {day === 15 && (
                                  <div className="w-full bg-green-500 text-white text-xs px-2 py-1 rounded truncate">
                                    Especial
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scheduled Posts List */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Próximas Publicações</h3>
                
                <div className="space-y-4">
                  {[
                    { 
                      title: 'Novo hospital será inaugurado em Parnaíba', 
                      date: '15/01/2024', 
                      time: '08:00', 
                      status: 'scheduled',
                      author: 'João Silva',
                      category: 'Saúde'
                    },
                    { 
                      title: 'Festival de inverno movimenta turismo em Pedro II', 
                      date: '15/01/2024', 
                      time: '14:30', 
                      status: 'scheduled',
                      author: 'Maria Santos',
                      category: 'Turismo'
                    },
                    { 
                      title: 'Governador visita obras da BR-343', 
                      date: '16/01/2024', 
                      time: '09:15', 
                      status: 'draft',
                      author: 'Carlos Oliveira',
                      category: 'Política'
                    }
                  ].map((post, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{post.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{post.date} às {post.time}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{post.author}</span>
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          post.status === 'scheduled' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
                        </span>
                        
                        <div className="flex space-x-1">
                          <button className="p-2 hover:bg-white rounded-lg transition-colors" title="Editar">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-white rounded-lg transition-colors" title="Excluir">
                            <Trash className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <SiteAnalyticsPanel days={30} />
              <AnalyticsPanel initialDays={30} />
            </div>
          )}
          {activeTab === 'advanced-analytics' && (
            <DetailedAnalytics />
          )}
          {activeTab === 'publicidade' && (
            <PublicidadeContent />
          )}
          {activeTab === 'configuracoes' && (
            <div className="space-y-8">
              {/* Site Settings */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-6">Configurações do Site</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Site</label>
                    <input 
                      type="text" 
                      defaultValue="R10 Piauí" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                    <input 
                      type="text" 
                      defaultValue="Notícias do Piauí em tempo real" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição do Site</label>
                    <textarea 
                      rows={3}
                      defaultValue="Portal de notícias líder no Piauí, oferecendo cobertura completa dos acontecimentos locais, regionais e nacionais."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL do Site</label>
                    <input 
                      type="url" 
                      defaultValue="https://r10piaui.com" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contato</label>
                    <input 
                      type="email" 
                      defaultValue="contato@r10piaui.com" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Categories Management */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900">Gestão de Categorias</h3>
                  <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Nova Categoria</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Política', color: 'bg-blue-500', posts: 45 },
                    { name: 'Economia', color: 'bg-green-500', posts: 32 },
                    { name: 'Esportes', color: 'bg-orange-500', posts: 28 },
                    { name: 'Cultura', color: 'bg-purple-500', posts: 22 },
                    { name: 'Saúde', color: 'bg-red-500', posts: 18 },
                    { name: 'Educação', color: 'bg-indigo-500', posts: 15 }
                  ].map((category, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                        <div className="flex space-x-1">
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <Trash className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{category.posts} matérias</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO Settings */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-6">Configurações de SEO</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title Padrão</label>
                    <input 
                      type="text" 
                      defaultValue="R10 Piauí - Notícias do Piauí em tempo real"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description Padrão</label>
                    <textarea 
                      rows={3}
                      defaultValue="Acompanhe as principais notícias do Piauí no R10. Cobertura completa de política, economia, esportes, cultura e muito mais."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Palavras-chave</label>
                    <input 
                      type="text" 
                      defaultValue="piauí, notícias, teresina, política, economia, esportes"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* User Preferences */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-6">Preferências do Usuário</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Notificações por Email</h4>
                      <p className="text-sm text-gray-600">Receber alertas sobre novas matérias e comentários</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto-save</h4>
                      <p className="text-sm text-gray-600">Salvar automaticamente rascunhos durante a edição</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Modo Escuro</h4>
                      <p className="text-sm text-gray-600">Usar tema escuro no dashboard</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-6">Status do Sistema</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">Servidor</span>
                    </div>
                    <p className="text-sm text-green-600">Online</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">Banco de Dados</span>
                    </div>
                    <p className="text-sm text-green-600">Conectado</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">CDN</span>
                    </div>
                    <p className="text-sm text-green-600">Ativo</p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium text-yellow-800">Backup</span>
                    </div>
                    <p className="text-sm text-yellow-600">Pendente</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5" />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </div>
          )}

          {/* Categorias Content */}
          {activeTab === 'categorias' && canAccessCategories && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Categorias</h2>
                  <p className="text-gray-600 mt-1">Gerencie categorias, subcategorias e municípios</p>
                </div>
              </div>
              
              <CategoryManager />
            </div>
          )}
        </div>

      {/* Banner Form Modal */}
      {showBannerForm && (
        <BannerForm
          banner={editingBanner}
          onSave={handleSaveBanner}
          onCancel={() => {
            setShowBannerForm(false);
            setEditingBanner(undefined);
          }}
        />
      )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;