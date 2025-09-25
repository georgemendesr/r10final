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
import LayoutManager from './LayoutManager';
import { useAuth } from '../contexts/AuthContext';
import { adsService, Banner } from '../services/adsService';
import BannerForm from './BannerForm';
import CategoryManager from './CategoryManager';
import UsersManager from './UsersManager';
import instagramAutomation from '../services/instagramAutomation';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [realtimeUsers, setRealtimeUsers] = useState(1247);
  const [notifications, setNotifications] = useState(3);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('7d');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | undefined>();
  const { user } = useAuth();
  const role = user?.role || 'viewer';

  const allTabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3, badge: null as string | null, url: '/admin' },
    { id: 'materias', label: 'Matérias', icon: FileText, badge: '5', url: '/admin/materias' },
    { id: 'midia', label: 'Mídia', icon: Image, badge: null as string | null, url: '/admin?tab=midia' },
    { id: 'layout', label: 'Layout', icon: Layout, badge: null as string | null, url: '/admin?tab=layout' },
    { id: 'instagram', label: 'Instagram', icon: Camera, badge: null as string | null, url: '/admin?tab=instagram' },
    { id: 'agendamento', label: 'Agenda', icon: Calendar, badge: null as string | null, url: '/admin?tab=agendamento' },
    { id: 'banners', label: 'Banner Ads', icon: Target, badge: null as string | null, url: '/admin?tab=banners' },
    { id: 'categorias', label: 'Categorias', icon: Settings, badge: null as string | null, url: '/admin?tab=categorias' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, badge: null as string | null, url: '/admin?tab=analytics' },
    { id: 'usuarios', label: 'Usuários', icon: Users, badge: null as string | null, url: '/admin/usuarios' }
  ];

  const allowedTabIdsByRole: Record<string, string[]> = {
    admin: allTabs.map(t => t.id),
    editor: ['materias', 'instagram'],
    reporter: ['materias', 'instagram'],
    viewer: []
  };

  const allowedTabIds = allowedTabIdsByRole[role] || [];
  const isTabAllowed = (tabId: string) => allowedTabIds.includes(tabId);

  // Detectar aba ativa pela URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/admin/materias') {
      setActiveTab('materias');
    } else if (path === '/admin/usuarios') {
      setActiveTab('usuarios');
    } else if (path === '/admin/configuracoes') {
      setActiveTab('configuracoes');
    } else if (path === '/admin') {
      const tabParam = searchParams.get('tab');
      if (tabParam && ['overview', 'midia', 'layout', 'instagram', 'agendamento', 'banners', 'categorias', 'analytics'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else {
        setActiveTab('overview');
      }
    }

    // Inicializar Instagram Automation
    instagramAutomation.requestNotificationPermission();
  }, [location.pathname, searchParams]);

  // Redirecionar se o usuário não puder ver a aba atual
  useEffect(() => {
    if (!activeTab) return;
    // Admin tem acesso total
    if (role === 'admin') return;

    // Se estiver em rotas bloqueadas (usuarios/configuracoes), manda para matérias
    if (location.pathname === '/admin/usuarios' || location.pathname === '/admin/configuracoes') {
      if (!isTabAllowed('usuarios')) {
        setActiveTab('materias');
        navigate('/admin/materias', { replace: true });
        return;
      }
    }

    // Se estiver em /admin com tab não permitido ou sem tab
    if (location.pathname === '/admin') {
      const tabParam = searchParams.get('tab');
      const desired = tabParam || activeTab;
      if (!isTabAllowed(desired)) {
        // Preferência: matérias; se não, instagram; caso contrário nada
        const fallback = isTabAllowed('materias') ? 'materias' : (isTabAllowed('instagram') ? 'instagram' : '');
        if (fallback) {
          setActiveTab(fallback);
          navigate(fallback === 'materias' ? '/admin/materias' : '/admin?tab=instagram', { replace: true });
        }
      }
    }
  }, [activeTab, role, location.pathname, navigate, searchParams]);

  // Simulação de dados em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeUsers(prev => prev + Math.floor(Math.random() * 10 - 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Carregar banners
  useEffect(() => {
    setBanners(adsService.getBanners());
  }, []);

  const stats = {
    todayViews: 45821,
    todayUsers: 12456,
    postsPublished: 28,
    engagementRate: 8.4
  };

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
    { label: 'Hoje', value: '45.8k', sublabel: 'visualizações', color: 'from-blue-500 to-cyan-400', icon: Eye },
    { label: 'Agora', value: realtimeUsers.toLocaleString(), sublabel: 'usuários online', color: 'from-green-500 to-emerald-400', icon: Users },
    { label: 'Esta semana', value: '28', sublabel: 'matérias publicadas', color: 'from-purple-500 to-pink-400', icon: FileText },
    { label: 'Engajamento', value: '8.4%', sublabel: 'taxa média', color: 'from-orange-500 to-red-400', icon: Heart }
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

  const topArticles = [
    { title: 'Governador anuncia novo investimento em saúde', views: 15420, readTime: '4:32', engagement: 8.9 },
    { title: 'Festival de Pedro II bate recorde histórico', views: 12380, readTime: '3:45', engagement: 7.6 },
    { title: 'Chuvas intensas atingem região de Parnaíba', views: 9850, readTime: '2:58', engagement: 6.8 },
    { title: 'Nova escola técnica será inaugurada em Picos', views: 8200, readTime: '3:12', engagement: 7.2 },
    { title: 'Prefeito de Teresina apresenta novo projeto', views: 7650, readTime: '4:01', engagement: 6.5 }
  ];

  const categoryPerformance = [
    { name: 'Política', articles: 45, views: 125000, engagement: 8.2 },
    { name: 'Economia', articles: 32, views: 89000, engagement: 7.1 },
    { name: 'Esportes', articles: 28, views: 76000, engagement: 9.3 },
    { name: 'Cultura', articles: 22, views: 54000, engagement: 6.8 },
    { name: 'Saúde', articles: 18, views: 42000, engagement: 7.9 }
  ];

  const handleSaveBanner = (banner: Banner) => {
    setBanners(adsService.getBanners());
    setShowBannerForm(false);
    setEditingBanner(undefined);
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setShowBannerForm(true);
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (confirm('Tem certeza que deseja excluir este banner?')) {
      adsService.deleteBanner(bannerId);
      setBanners(adsService.getBanners());
    }
  };

  const PublicidadeContent = () => {
    const stats = adsService.getBannerStats();
    const positions = adsService.getAvailablePositions();

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
            src="/uploads/imagens/logor10.png"
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

        {/* Navigation - Completo mas compacto (filtrado por papel) */}
        <nav className="space-y-1">
          {allTabs.filter(item => isTabAllowed(item.id)).map(item => (
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
        {(role === 'admin' || role === 'editor') && (
          <div className="mt-3">
            <Link to="/admin/nova-materia" className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 px-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-base">
              <Plus className="w-5 h-5" />
              <span>Nova Matéria</span>
            </Link>
          </div>
        )}

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
      <div className="space-y-6">
        {/* Quick Stats Cards - Compactos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-base font-medium text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ações Rápidas - Atalhos Funcionais */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(role === 'admin' || role === 'editor') && (
            <button 
              onClick={() => setActiveTab('materias')}
              className="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors group"
            >
              <Plus className="w-8 h-8 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-base font-medium text-red-700">Nova Matéria</span>
            </button>
            )}

            {isTabAllowed('midia') && (
            <button 
              onClick={() => setActiveTab('midia')}
              className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
            >
              <ImageIcon className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-base font-medium text-purple-700">Gerenciar Mídia</span>
            </button>
            )}
            
            {isTabAllowed('instagram') && (
            <button 
              onClick={() => setActiveTab('instagram')}
              className="flex flex-col items-center p-4 bg-pink-50 hover:bg-pink-100 rounded-lg border border-pink-200 transition-colors group"
            >
              <Instagram className="w-8 h-8 text-pink-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-base font-medium text-pink-700">Publicar Instagram</span>
            </button>
            )}

            {isTabAllowed('agendamento') && (
            <button 
              onClick={() => setActiveTab('agendamento')}
              className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
            >
              <Calendar className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-base font-medium text-blue-700">Agendamentos</span>
            </button>
            )}
          </div>
        </div>

        {/* Layout Moderno - Grid Dinâmico */}
        <div className="grid grid-cols-12 gap-6">
          {/* Últimas Notícias - Card Grande */}
          <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-white via-red-50 to-red-100 rounded-2xl shadow-lg border border-red-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-600 rounded-xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Últimas Publicações</h3>
                  <p className="text-red-600 text-sm font-medium">Atualizações em tempo real</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('materias')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200"
              >
                Ver todas →
              </button>
            </div>
            
            {/* Grid de Notícias Moderno */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Governador anuncia novas obras em Teresina", time: "há 2 horas", views: "1.2k", status: "published", featured: true },
                { title: "Festival de Inverno movimenta turismo no interior", time: "há 4 horas", views: "856", status: "published", featured: false },
                { title: "Novo hospital será inaugurado em Parnaíba", time: "há 6 horas", views: "2.1k", status: "published", featured: false },
                { title: "Chuvas trazem alívio para produtores rurais", time: "há 8 horas", views: "743", status: "published", featured: false }
              ].map((news, index) => (
                <div key={index} className={`group relative overflow-hidden rounded-xl border-2 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                  news.featured 
                    ? 'bg-gradient-to-br from-red-600 to-red-700 border-red-500 text-white col-span-full' 
                    : 'bg-white border-gray-200 hover:border-red-300'
                }`}>
                  {news.featured && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-black px-3 py-1 rounded-bl-xl font-bold text-xs">
                      DESTAQUE
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className={`font-bold leading-tight mb-3 ${
                      news.featured ? 'text-white text-lg' : 'text-gray-900 text-sm'
                    }`}>
                      {news.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm font-medium ${
                          news.featured ? 'text-red-200' : 'text-gray-500'
                        }`}>
                          {news.time}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Eye className={`w-4 h-4 ${news.featured ? 'text-red-200' : 'text-gray-400'}`} />
                          <span className={`text-sm ${news.featured ? 'text-red-200' : 'text-gray-500'}`}>
                            {news.views}
                          </span>
                        </div>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                        news.status === 'published' 
                          ? news.featured 
                            ? 'bg-green-500 text-white' 
                            : 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        ✓ Publicado
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights - Card Vertical */}
          <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Insights</h3>
                  <p className="text-purple-200 text-base">Análise em tempo real</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-5 h-5 text-pink-300" />
                  <span className="text-2xl font-bold text-white">2.8k</span>
                </div>
                <p className="text-purple-200 text-base">Curtidas hoje</p>
                <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-pink-400 h-1.5 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-5 h-5 text-green-300" />
                  <span className="text-2xl font-bold text-white">1.2k</span>
                </div>
                <p className="text-purple-200 text-base">Comentários</p>
                <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-green-400 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <Share2 className="w-5 h-5 text-yellow-300" />
                  <span className="text-2xl font-bold text-white">892</span>
                </div>
                <p className="text-purple-200 text-sm">Compartilhamentos</p>
                <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: '72%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Rankings - Cards Lado a Lado */}
          <div className="col-span-12 lg:col-span-6 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <div className="text-2xl">🔥</div>
              </div>
              <div>
                <h3 className="text-lg font-bold">Trending Hoje</h3>
                <p className="text-orange-200 text-sm">Top 3 do dia</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { title: "Centro médico na zona norte", views: "3.4k", pos: 1 },
                { title: "Alagamentos em bairros", views: "2.8k", pos: 2 },
                { title: "Festival gastronômico", views: "2.1k", pos: 3 }
              ].map((news, index) => (
                <div key={index} className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="w-8 h-8 bg-white text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {news.pos}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm leading-tight">{news.title}</h4>
                    <p className="text-orange-200 text-xs">{news.views} views</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-orange-200">crescimento</div>
                    <div className="text-sm font-bold text-white">+{Math.floor(Math.random() * 500 + 200)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Semanal - Card Moderno */}
          <div className="col-span-12 lg:col-span-6 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <div className="text-2xl">📊</div>
              </div>
              <div>
                <h3 className="text-lg font-bold">Performance Semanal</h3>
                <p className="text-cyan-200 text-sm">Últimos 7 dias</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white mb-1">12.5k</div>
                <div className="text-cyan-200 text-sm">Total de views</div>
                <div className="flex items-center space-x-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-300" />
                  <span className="text-xs text-green-300 font-medium">+4.8k</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white mb-1">89%</div>
                <div className="text-cyan-200 text-sm">Taxa de leitura</div>
                <div className="flex items-center space-x-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-300" />
                  <span className="text-xs text-green-300 font-medium">+12%</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 col-span-2">
                <div className="text-lg font-bold text-white mb-2">Top da Semana</div>
                <div className="text-sm text-cyan-200">"Governador inaugura rodovia" - 9.8k views</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader notifications={notifications} />
      
      {/* Navegação Mobile - Substitui sidebar no mobile */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1250px] mx-auto px-4">
          <div className="flex overflow-x-auto py-3 space-x-2 scrollbar-hide">
            {allTabs
              .filter(item => isTabAllowed(item.id))
              .filter(item => ['overview','materias','midia','layout','instagram','agendamento'].includes(item.id))
              .map(item => (
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
            {activeTab === 'overview' && isTabAllowed('overview') && <OverviewContent />}
            {activeTab === 'materias' && isTabAllowed('materias') && <PostsManager />}
          {activeTab === 'midia' && isTabAllowed('midia') && <MediaGallery />}
          {activeTab === 'layout' && isTabAllowed('layout') && (
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
          {activeTab === 'instagram' && isTabAllowed('instagram') && <InstagramCardGenerator />}
          {activeTab === 'agendamento' && isTabAllowed('agendamento') && (
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
          {activeTab === 'analytics' && isTabAllowed('analytics') && (
            <div className="space-y-6">
              {/* Analytics Overview - Compact Version */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Visão Geral de Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl p-4 shadow-sm">
                    <h4 className="font-medium text-white mb-1 text-sm">Visualizações</h4>
                    <p className="text-2xl font-bold text-white">45.8k</p>
                    <p className="text-xs text-white/80 mt-1">+12% vs último mês</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl p-4 shadow-sm">
                    <h4 className="font-medium text-white mb-1 text-sm">Usuários Online</h4>
                    <p className="text-2xl font-bold text-white">1.2k</p>
                    <p className="text-xs text-white/80 mt-1">+5% nas últimas 24h</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl p-4 shadow-sm">
                    <h4 className="font-medium text-white mb-1 text-sm">Engajamento</h4>
                    <p className="text-2xl font-bold text-white">8.4%</p>
                    <p className="text-xs text-white/80 mt-1">+0.5% esta semana</p>
                  </div>
                </div>
              </div>

              {/* Timeframe Selector - More Compact */}
              <div className="flex justify-end">
                <div className="flex bg-gray-100 rounded-lg p-1 space-x-1">
                  <button 
                    onClick={() => setAnalyticsTimeframe('7d')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      analyticsTimeframe === '7d' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-700 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    7 dias
                  </button>
                  <button 
                    onClick={() => setAnalyticsTimeframe('30d')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      analyticsTimeframe === '30d' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-700 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    30 dias
                  </button>
                  <button 
                    onClick={() => setAnalyticsTimeframe('90d')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      analyticsTimeframe === '90d' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-700 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    90 dias
                  </button>
                </div>
              </div>

              {/* Charts Grid - 2 columns for better use of space */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Views & Users Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Visualizações e Usuários</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={viewsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} name="Visualizações" />
                      <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} name="Usuários" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Traffic Sources */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Fontes de Tráfego</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={trafficSources}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {trafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={trafficSources[index].color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tables Grid */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Articles - Compact Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Artigos Mais Lidos</h3>
                  <div className="space-y-3">
                    {topArticles.slice(0, 5).map((article, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{article.title}</h4>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-blue-600 font-medium">{article.views.toLocaleString()} views</span>
                            <span className="text-xs text-gray-500">{article.readTime}</span>
                            <span className="text-xs text-green-600 font-medium">{article.engagement}% eng.</span>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Performance - Compact Cards */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Desempenho por Categoria</h3>
                  <div className="space-y-3">
                    {categoryPerformance.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                            <p className="text-xs text-gray-500">{category.articles} artigos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{category.views.toLocaleString()}</p>
                          <p className="text-xs text-green-600">{category.engagement}% eng.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'banners' && isTabAllowed('banners') && (
            <PublicidadeContent />
          )}
          {activeTab === 'usuarios' && role === 'admin' && (
            <UsersManager />
          )}
          {activeTab === 'configuracoes' && isTabAllowed('configuracoes') && (
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
          {activeTab === 'categorias' && isTabAllowed('categorias') && (
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