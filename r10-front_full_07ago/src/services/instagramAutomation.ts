// Instagram Automation Service
// Monitora posts marcados com "INSTAGRAM" e publica automaticamente

interface AutoPostQueue {
  id: string;
  title: string;
  hat?: string;
  scheduledTime: number;
  status: 'pending' | 'published' | 'error';
  attempts: number;
}

class InstagramAutomationService {
  private queue: AutoPostQueue[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private readonly DELAY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;
  private readonly STORAGE_KEY = 'r10_instagram_queue';

  constructor() {
    this.loadQueue();
    this.startMonitoring();
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.queue = JSON.parse(saved);
        // Remover itens muito antigos (mais de 24h)
        const now = Date.now();
        this.queue = this.queue.filter(item => 
          (now - item.scheduledTime) < 24 * 60 * 60 * 1000
        );
        this.saveQueue();
      }
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Erro ao salvar fila:', error);
    }
  }

  // Adiciona um post à fila de automação
  addToQueue(postId: string, title: string, hat?: string) {
    // Verificar se já existe na fila
    const existing = this.queue.find(item => item.id === postId);
    if (existing) {
      console.log('Post já está na fila de Instagram:', postId);
      return;
    }

    const scheduledTime = Date.now() + (this.DELAY_MINUTES * 60 * 1000);
    
    const queueItem: AutoPostQueue = {
      id: postId,
      title: title.substring(0, 100), // Limitar título
      hat,
      scheduledTime,
      status: 'pending',
      attempts: 0
    };

    this.queue.push(queueItem);
    this.saveQueue();

    console.log(`📱 Post adicionado à fila do Instagram: ${title.substring(0, 50)}...`);
    console.log(`⏰ Será publicado em ${this.DELAY_MINUTES} minutos`);

    // Notificar usuário
    this.showNotification(
      'Instagram Agendado', 
      `Post será publicado automaticamente em ${this.DELAY_MINUTES} minutos`
    );
  }

  // Remove um post da fila
  removeFromQueue(postId: string) {
    this.queue = this.queue.filter(item => item.id !== postId);
    this.saveQueue();
  }

  // Inicia o monitoramento da fila
  private startMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Verificar a cada minuto
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, 60 * 1000);

    console.log('🤖 Instagram Automation iniciado - verificando a cada minuto');
  }

  // Processa itens da fila que estão prontos
  private async processQueue() {
    const now = Date.now();
    const readyItems = this.queue.filter(item => 
      item.status === 'pending' && 
      item.scheduledTime <= now &&
      item.attempts < this.MAX_ATTEMPTS
    );

    for (const item of readyItems) {
      await this.publishPost(item);
    }

    // Limpar itens processados ou com muitas tentativas
    this.queue = this.queue.filter(item => 
      item.status === 'pending' && item.attempts < this.MAX_ATTEMPTS
    );
    
    if (readyItems.length > 0) {
      this.saveQueue();
    }
  }

  // Publica um post no Instagram
  private async publishPost(item: AutoPostQueue) {
    item.attempts++;
    
    try {
      console.log(`📱 Publicando automaticamente: ${item.title}`);

      const response = await fetch('http://localhost:8080/api/social/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          hat: item.hat || 'NOTÍCIA'
        })
      });

      const result = await response.json();

      if (result.ok && result.postId) {
        item.status = 'published';
        
        console.log(`✅ Post publicado automaticamente no Instagram!`);
        console.log(`📱 ID: ${result.postId}`);
        console.log(`📝 Título: ${item.title}`);

        // Salvar no histórico do componente
        this.saveToInstagramHistory({
          id: Date.now().toString(),
          title: item.title,
          instagramPostId: result.postId,
          publishedAt: new Date().toISOString(),
          status: 'success'
        });

        // Notificar sucesso
        this.showNotification(
          'Instagram Publicado!', 
          `Post "${item.title.substring(0, 30)}..." foi publicado automaticamente`
        );

      } else {
        throw new Error(result.error || 'Falha na publicação');
      }

    } catch (error) {
      console.error(`❌ Erro ao publicar automaticamente:`, error);
      
      if (item.attempts >= this.MAX_ATTEMPTS) {
        item.status = 'error';
        this.showNotification(
          'Erro no Instagram', 
          `Falha ao publicar "${item.title.substring(0, 30)}..." após ${this.MAX_ATTEMPTS} tentativas`
        );
      } else {
        // Reagendar para próxima tentativa (5 minutos)
        item.scheduledTime = Date.now() + (5 * 60 * 1000);
      }
    }
  }

  // Salva no histórico do Instagram
  private saveToInstagramHistory(post: any) {
    try {
      const existing = localStorage.getItem('r10_instagram_posts');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(post);
      
      // Manter apenas os últimos 10
      if (history.length > 10) {
        history.splice(10);
      }
      
      localStorage.setItem('r10_instagram_posts', JSON.stringify(history));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  // Mostra notificação para o usuário
  private showNotification(title: string, message: string) {
    // Tentar usar notificações do navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      });
    } else {
      // Fallback para console
      console.log(`🔔 ${title}: ${message}`);
    }
  }

  // Obtém status da fila
  getQueueStatus() {
    const now = Date.now();
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      ready: this.queue.filter(item => 
        item.status === 'pending' && item.scheduledTime <= now
      ).length,
      items: this.queue.map(item => ({
        ...item,
        remainingTime: Math.max(0, item.scheduledTime - now)
      }))
    };
  }

  // Para o serviço
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('🛑 Instagram Automation parado');
  }

  // Solicita permissão para notificações
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
}

// Instância singleton
export const instagramAutomation = new InstagramAutomationService();

// Hook para usar o serviço
export const useInstagramAutomation = () => {
  return {
    addToQueue: instagramAutomation.addToQueue.bind(instagramAutomation),
    removeFromQueue: instagramAutomation.removeFromQueue.bind(instagramAutomation),
    getQueueStatus: instagramAutomation.getQueueStatus.bind(instagramAutomation),
    requestNotificationPermission: instagramAutomation.requestNotificationPermission.bind(instagramAutomation)
  };
};

export default instagramAutomation;
