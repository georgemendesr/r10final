import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Volume2, TrendingUp, Users, Clock, Zap, Headphones } from 'lucide-react';

interface AudioStats {
  totalPlays: number;
  todayPlays: number;
  playsByPosition: {
    supermanchete: number;
    destaque: number;
    geral: number;
  };
  playsByDay: Array<{
    date: string;
    plays: number;
  }>;
  topAudioPosts: Array<{
    id: string;
    title: string;
    plays: number;
  }>;
  averageListenTime: string;
  elevenLabsUsage: number;
  webSpeechUsage: number;
}

const AudioAnalytics: React.FC = () => {
  const [stats, setStats] = useState<AudioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAudioStats();
  }, []);

  const fetchAudioStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/analytics/audio-stats');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Erro ao buscar analytics:', err);
      setError('Erro ao carregar estatísticas de áudio');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Analytics de Áudio</h3>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Analytics de Áudio</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">{error || 'Erro ao carregar estatísticas'}</p>
        </div>
      </div>
    );
  }

  // Dados para gráfico de pizza (posições)
  const positionData = [
    { name: 'Super Manchete', value: stats.playsByPosition.supermanchete, color: '#E53935' },
    { name: 'Destaque', value: stats.playsByPosition.destaque, color: '#7A1F2B' },
    { name: 'Geral', value: stats.playsByPosition.geral, color: '#424242' }
  ];

  // Dados para gráfico de pizza (engines)
  const engineData = [
    { name: 'ElevenLabs', value: stats.elevenLabsUsage, color: '#8B5CF6' },
    { name: 'Web Speech', value: stats.webSpeechUsage, color: '#3B82F6' }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Analytics de Áudio</h3>
        </div>
        <button 
          onClick={fetchAudioStats}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total de Reproduções */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total de Reproduções</p>
              <p className="text-2xl font-bold text-blue-800">{stats.totalPlays}</p>
            </div>
            <Volume2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Hoje */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Hoje</p>
              <p className="text-2xl font-bold text-green-800">{stats.todayPlays}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Tempo Médio */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Tempo Médio</p>
              <p className="text-2xl font-bold text-orange-800">{stats.averageListenTime}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        {/* ElevenLabs Usage */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">ElevenLabs</p>
              <p className="text-2xl font-bold text-purple-800">{stats.elevenLabsUsage}%</p>
            </div>
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Reproduções por Dia */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-4">Reproduções por Dia</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.playsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                formatter={(value) => [value, 'Reproduções']}
              />
              <Line type="monotone" dataKey="plays" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reproduções por Posição */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-4">Por Posição</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={positionData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {positionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engine Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-4">Uso por Engine</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={engineData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {engineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Posts com Áudio */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-4">Top Posts com Áudio</h4>
          <div className="space-y-3">
            {stats.topAudioPosts.map((post, index) => (
              <div key={post.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {index + 1}. {post.title}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-600">{post.plays}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-gray-800 mb-2">💡 Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            • <strong>{stats.elevenLabsUsage}%</strong> das reproduções usam ElevenLabs (qualidade premium)
          </div>
          <div>
            • <strong>Super Manchetes</strong> têm {stats.playsByPosition.supermanchete} reproduções
          </div>
          <div>
            • Tempo médio de escuta: <strong>{stats.averageListenTime}</strong>
          </div>
          <div>
            • <strong>{stats.todayPlays}</strong> reproduções hoje vs <strong>{stats.totalPlays}</strong> total
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioAnalytics;