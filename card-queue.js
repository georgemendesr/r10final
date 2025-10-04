// ========================================
// SISTEMA DE FILA PARA GERAÇÃO DE CARDS
// Garante apenas 1 card por vez
// ========================================

/**
 * Fila simples para evitar concorrência na geração de cards
 * Evita múltiplos Puppeteer/Canvas rodando simultaneamente
 */

class CardQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Adiciona tarefa à fila
   * @param {Function} task - Função async que gera o card
   * @returns {Promise} - Resolve quando o card for gerado
   */
  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  /**
   * Processa fila sequencialmente
   */
  async process() {
    // Se já está processando ou fila vazia, não faz nada
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const { task, resolve, reject } = this.queue.shift();

    console.log(`📋 Processando card (${this.queue.length} na fila)`);
    
    const startTime = Date.now();
    const startMem = process.memoryUsage().heapUsed / 1024 / 1024;

    try {
      const result = await task();
      
      const endTime = Date.now();
      const endMem = process.memoryUsage().heapUsed / 1024 / 1024;
      
      console.log(`✅ Card gerado em ${endTime - startTime}ms`);
      console.log(`💾 Memória: ${startMem.toFixed(1)}MB → ${endMem.toFixed(1)}MB (Δ ${(endMem - startMem).toFixed(1)}MB)`);
      
      // CRÍTICO: Forçar garbage collection após cada card
      if (global.gc) {
        global.gc();
        const afterGC = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`🗑️ Após GC: ${afterGC.toFixed(1)}MB (liberou ${(endMem - afterGC).toFixed(1)}MB)`);
      }
      
      resolve(result);
    } catch (error) {
      console.error('❌ Erro ao gerar card:', error.message);
      reject(error);
    } finally {
      this.processing = false;
      
      // Pequeno delay antes do próximo (evita sobrecarga)
      if (this.queue.length > 0) {
        setTimeout(() => this.process(), 1000);
      }
    }
  }

  /**
   * Retorna status da fila
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    };
  }

  /**
   * Limpa a fila (emergência)
   */
  clear() {
    const cleared = this.queue.length;
    this.queue.forEach(({ reject }) => {
      reject(new Error('Fila limpa'));
    });
    this.queue = [];
    console.warn(`⚠️ Fila limpa (${cleared} tarefas removidas)`);
    return cleared;
  }
}

// Singleton global
const cardQueue = new CardQueue();

module.exports = cardQueue;
