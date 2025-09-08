export interface Banner {
  id: string;
  titulo: string;
  cliente: string;
  imagem: string;
  link: string;
  posicao: 'top-strip' | 'super-banner' | 'sidebar-article' | 'in-content' | 'news-sidebar';
  tipo: 'imagem' | 'html' | 'video' | 'gif';
  tamanho: '728x90' | '300x250' | '160x600' | '320x50' | '970x250' | '300x600' | 'personalizado';
  status: 'ativo' | 'pausado' | 'expirado' | 'agendado';
  dataInicio: string;
  dataFim: string;
  impressoesMax?: number;
  cliquesMax?: number;
  impressoesAtuais: number;
  cliquesAtuais: number;
  cpm?: number; // Custo por mil impressões
  cpc?: number; // Custo por clique
  valorTotal?: number;
  prioridade: 1 | 2 | 3 | 4 | 5; // 1 = maior prioridade
  segmentacao?: {
    categorias?: string[];
    dispositivos?: ('desktop' | 'tablet' | 'mobile')[];
    horarios?: string[];
    dias?: string[];
  };
  conteudoHtml?: string;
  observacoes?: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface BannerStats {
  impressoes: number;
  cliques: number;
  ctr: number; // Click Through Rate
  receita: number;
  periodo: string;
}

class AdsService {
  private readonly STORAGE_KEY = 'banners';

  // Obter todos os banners
  getBanners(): Banner[] {
    console.log('🔄 AdsService: Iniciando carregamento de banners...');
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    let banners;
    
    if (!stored) {
      console.log('📝 AdsService: Nenhum banner no localStorage, criando banners padrão...');
      banners = this.getDefaultBanners();
      this.saveBanners(banners);
      console.log('✅ AdsService: Banners padrão criados e salvos:', banners.length, 'banners');
    } else {
      try {
        banners = JSON.parse(stored);
        console.log('📖 AdsService: Banners carregados do localStorage:', banners.length, 'banners');
      } catch (err) {
        console.error('❌ AdsService: Erro ao parsear banners do localStorage:', err);
        console.log('🔄 AdsService: Recriando banners padrão...');
        banners = this.getDefaultBanners();
        this.saveBanners(banners);
      }
    }
    
    console.log('🎯 AdsService: Banners finais:', banners);
    return banners;
  }

  // Obter banners por posição
  getBannersByPosition(posicao: Banner['posicao']): Banner[] {
    const banners = this.getBanners();
    const now = new Date();
    
    console.log(`🔍 AdsService: Buscando banners para posição: ${posicao}`);
    console.log('📅 AdsService: Data atual:', now.toISOString());
    console.log('📊 AdsService: Total de banners:', banners.length);
    
    const filteredBanners = banners
      .filter(banner => {
        console.log(`🔍 AdsService: Verificando banner ${banner.id}:`, {
          posicao: banner.posicao,
          status: banner.status,
          dataInicio: banner.dataInicio,
          dataFim: banner.dataFim,
          impressoesMax: banner.impressoesMax,
          impressoesAtuais: banner.impressoesAtuais
        });
        
        // Filtrar por posição
        if (banner.posicao !== posicao) {
          console.log(`❌ AdsService: Banner ${banner.id} rejeitado: posição incorreta (${banner.posicao} != ${posicao})`);
          return false;
        }
        
        // Filtrar por status
        if (banner.status === 'pausado') {
          console.log(`❌ AdsService: Banner ${banner.id} rejeitado: status pausado`);
          return false;
        }
        
        // Verificar datas
        const inicio = new Date(banner.dataInicio);
        const fim = new Date(banner.dataFim);
        if (now < inicio || now > fim) {
          console.log(`❌ AdsService: Banner ${banner.id} rejeitado: fora do período (${inicio.toISOString()} - ${fim.toISOString()})`);
          return false;
        }
        
        // Verificar limites de impressões/cliques
        if (banner.impressoesMax && banner.impressoesAtuais >= banner.impressoesMax) {
          console.log(`❌ AdsService: Banner ${banner.id} rejeitado: limite de impressões atingido`);
          return false;
        }
        if (banner.cliquesMax && banner.cliquesAtuais >= banner.cliquesMax) {
          console.log(`❌ AdsService: Banner ${banner.id} rejeitado: limite de cliques atingido`);
          return false;
        }
        
        console.log(`✅ AdsService: Banner ${banner.id} aprovado!`);
        return true;
      })
      .sort((a, b) => a.prioridade - b.prioridade); // Ordenar por prioridade
      
    console.log(`🎯 AdsService: Banners filtrados para ${posicao}:`, filteredBanners.length, 'banners');
    return filteredBanners;
  }

  // Obter banner ativo para uma posição (rotação)
  getActiveBanner(posicao: Banner['posicao']): Banner | null {
    console.log(`🎯 AdsService: getActiveBanner chamado para posição: ${posicao}`);
    
    const banners = this.getBannersByPosition(posicao);
    if (banners.length === 0) {
      console.log(`❌ AdsService: Nenhum banner ativo encontrado para posição: ${posicao}`);
      return null;
    }
    
    // Rotação simples baseada no tempo
    const index = Math.floor(Date.now() / 10000) % banners.length;
    const selectedBanner = banners[index];
    console.log(`🎯 AdsService: Banner selecionado para ${posicao}:`, selectedBanner);
    return selectedBanner;
  }

  // Registrar impressão
  registerImpression(bannerId: string): void {
    const banners = this.getBanners();
    const banner = banners.find(b => b.id === bannerId);
    
    if (banner) {
      banner.impressoesAtuais++;
      banner.dataAtualizacao = new Date().toISOString();
      this.saveBanners(banners);
      console.log(`📊 AdsService: Impressão registrada para banner ${bannerId}`);
      
      // Tracking para analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ad_impression', {
          banner_id: bannerId,
          banner_position: banner.posicao,
          banner_client: banner.cliente
        });
      }
    }
  }

  // Registrar clique
  registerClick(bannerId: string): void {
    const banners = this.getBanners();
    const banner = banners.find(b => b.id === bannerId);
    
    if (banner) {
      banner.cliquesAtuais++;
      banner.dataAtualizacao = new Date().toISOString();
      this.saveBanners(banners);
      console.log(`🖱️ AdsService: Clique registrado para banner ${bannerId}`);
      
      // Tracking para analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ad_click', {
          banner_id: bannerId,
          banner_position: banner.posicao,
          banner_client: banner.cliente,
          banner_link: banner.link
        });
      }
    }
  }

  // Criar novo banner
  createBanner(bannerData: Omit<Banner, 'id' | 'impressoesAtuais' | 'cliquesAtuais' | 'dataCriacao' | 'dataAtualizacao'>): Banner {
    const banner: Banner = {
      ...bannerData,
      id: this.generateId(),
      impressoesAtuais: 0,
      cliquesAtuais: 0,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    const banners = this.getBanners();
    banners.push(banner);
    this.saveBanners(banners);
    
    return banner;
  }

  // Atualizar banner
  updateBanner(id: string, updates: Partial<Banner>): Banner | null {
    const banners = this.getBanners();
    const index = banners.findIndex(b => b.id === id);
    
    if (index === -1) return null;
    
    banners[index] = {
      ...banners[index],
      ...updates,
      dataAtualizacao: new Date().toISOString()
    };
    
    this.saveBanners(banners);
    return banners[index];
  }

  // Excluir banner
  deleteBanner(id: string): boolean {
    const banners = this.getBanners();
    const filteredBanners = banners.filter(b => b.id !== id);
    
    if (filteredBanners.length === banners.length) return false;
    
    this.saveBanners(filteredBanners);
    return true;
  }

  // Obter estatísticas
  getBannerStats(bannerId?: string): BannerStats {
    const banners = bannerId 
      ? this.getBanners().filter(b => b.id === bannerId)
      : this.getBanners();
    
    const impressoes = banners.reduce((sum, b) => sum + b.impressoesAtuais, 0);
    const cliques = banners.reduce((sum, b) => sum + b.cliquesAtuais, 0);
    const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
    const receita = banners.reduce((sum, b) => {
      let valor = 0;
      if (b.cpm && b.impressoesAtuais) valor += (b.impressoesAtuais / 1000) * b.cpm;
      if (b.cpc && b.cliquesAtuais) valor += b.cliquesAtuais * b.cpc;
      if (b.valorTotal) valor += b.valorTotal;
      return sum + valor;
    }, 0);
    
    return {
      impressoes,
      cliques,
      ctr: Number(ctr.toFixed(2)),
      receita: Number(receita.toFixed(2)),
      periodo: 'total'
    };
  }

  // Obter posições disponíveis (baseadas no layout existente)
  getAvailablePositions(): Array<{value: Banner['posicao'], label: string, description: string}> {
    return [
      { value: 'top-strip', label: 'Topo da Página', description: 'Banner horizontal no topo - já implementado (728x90)' },
      { value: 'super-banner', label: 'Super Banner', description: 'Na NewsGeneralSection - já implementado (970x250)' },
      { value: 'news-sidebar', label: 'Sidebar Notícias', description: 'Coluna direita da NewsGeneralSection - mesmo tamanho da imagem principal (w-full h-80)' },
      { value: 'sidebar-article', label: 'Sidebar Artigo', description: 'AdBox na página de artigo - já implementado (300x250)' },
      { value: 'in-content', label: 'Dentro do Texto', description: 'Banner quadrado inserido no meio do conteúdo da matéria (300x250)' }
    ];
  }

  // Tamanhos padrão
  getStandardSizes(): Array<{value: Banner['tamanho'], label: string, dimensions: string}> {
    return [
      { value: '728x90', label: 'Leaderboard', dimensions: '728x90px' },
      { value: '300x250', label: 'Medium Rectangle', dimensions: '300x250px' },
      { value: '160x600', label: 'Wide Skyscraper', dimensions: '160x600px' },
      { value: '320x50', label: 'Mobile Banner', dimensions: '320x50px' },
      { value: '970x250', label: 'Billboard', dimensions: '970x250px' },
      { value: '300x600', label: 'Half Page', dimensions: '300x600px' },
      { value: 'personalizado', label: 'Personalizado', dimensions: 'Definir manualmente' }
    ];
  }

  // Salvar banners
  private saveBanners(banners: Banner[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(banners));
      console.log('💾 AdsService: Banners salvos no localStorage:', banners.length, 'banners');
    } catch (err) {
      console.error('❌ AdsService: Erro ao salvar banners:', err);
    }
  }

  // Forçar reset dos banners (útil para desenvolvimento)
  resetBanners(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🔄 AdsService: Banners resetados - próxima chamada criará banners padrão');
  }

  // Upload de imagem para banner
  uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Arquivo deve ser uma imagem'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result); // Retorna data URL
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  // Gerar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Banners padrão para demonstração
  private getDefaultBanners(): Banner[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    console.log('🏗️ AdsService: Criando banners padrão...');
    console.log('📅 AdsService: Data atual:', now.toISOString());
    console.log('📅 AdsService: Data futura:', futureDate.toISOString());

    const banners = [
      {
        id: 'banner-1',
        titulo: 'Campanha Governo do Estado',
        cliente: 'Governo do Piauí',
        imagem: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=728&h=90&fit=crop&crop=center',
        link: 'https://piaui.pi.gov.br',
        posicao: 'top-strip',
        tipo: 'imagem',
        tamanho: '728x90',
        status: 'ativo',
        dataInicio: now.toISOString(),
        dataFim: futureDate.toISOString(),
        impressoesMax: 100000,
        impressoesAtuais: 15420,
        cliquesAtuais: 234,
        cpm: 5.00,
        prioridade: 1,
        dataCriacao: now.toISOString(),
        dataAtualizacao: now.toISOString()
      },
      {
        id: 'banner-2',
        titulo: 'Promoção Loja Local',
        cliente: 'Magazine Silva',
        imagem: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=250&fit=crop&crop=center',
        link: 'https://magazinesilva.com.br',
        posicao: 'sidebar-article',
        tipo: 'imagem',
        tamanho: '300x250',
        status: 'ativo',
        dataInicio: now.toISOString(),
        dataFim: futureDate.toISOString(),
        impressoesAtuais: 8750,
        cliquesAtuais: 156,
        valorTotal: 2500.00,
        prioridade: 2,
        dataCriacao: now.toISOString(),
        dataAtualizacao: now.toISOString()
      },
      {
        id: 'banner-3',
        titulo: 'Festival de Pedro II',
        cliente: 'Prefeitura de Pedro II',
        imagem: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=970&h=250&fit=crop&crop=center',
        link: 'https://pedroii.pi.gov.br/festival',
        posicao: 'super-banner',
        tipo: 'imagem',
        tamanho: '970x250',
        status: 'ativo',
        dataInicio: now.toISOString(),
        dataFim: futureDate.toISOString(),
        impressoesAtuais: 12380,
        cliquesAtuais: 298,
        cpc: 1.50,
        prioridade: 1,
        segmentacao: {
          categorias: ['cultura', 'turismo'],
          dispositivos: ['desktop', 'tablet']
        },
        dataCriacao: now.toISOString(),
        dataAtualizacao: now.toISOString()
      },
      {
        id: 'banner-4',
        titulo: 'Google AdSense - In Content',
        cliente: 'Google AdSense',
        imagem: '', // Não usado para HTML
        link: '',   // Não usado para HTML
        posicao: 'in-content',
        tipo: 'html',
        tamanho: '300x250',
        status: 'ativo',
        dataInicio: now.toISOString(),
        dataFim: futureDate.toISOString(),
        impressoesAtuais: 8420,
        cliquesAtuais: 89,
        conteudoHtml: `
          <ins class="adsbygoogle"
               style="display:inline-block;width:300px;height:250px"
               data-ad-client="ca-pub-1234567890123456"
               data-ad-slot="1234567890"></ins>
          <script>
               (adsbygoogle = window.adsbygoogle || []).push({});
          </script>
        `,
        prioridade: 1,
        observacoes: 'Banner Google AdSense para inserção no meio do conteúdo das matérias',
        dataCriacao: now.toISOString(),
        dataAtualizacao: now.toISOString()
      },
      {
        id: 'banner-5',
        titulo: 'Campanha Turismo Piauí',
        cliente: 'SETUR Piauí',
        imagem: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=320&fit=crop&crop=center',
        link: 'https://turismo.pi.gov.br',
        posicao: 'news-sidebar',
        tipo: 'imagem',
        tamanho: 'personalizado',
        status: 'ativo',
        dataInicio: now.toISOString(),
        dataFim: futureDate.toISOString(),
        impressoesAtuais: 5230,
        cliquesAtuais: 127,
        cpm: 3.50,
        prioridade: 1,
        observacoes: 'Banner vertical na sidebar das Notícias Gerais - mesmo tamanho da imagem principal',
        dataCriacao: now.toISOString(),
        dataAtualizacao: now.toISOString()
      }
    ];

    console.log('✅ AdsService: Banners padrão criados:', banners.length, 'banners');
    return banners;
  }
}

export const adsService = new AdsService(); 