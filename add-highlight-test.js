const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/noticias.db');

// Conteúdo de teste com highlights animados
const contentWithHighlight = `O II Forró do Idoso foi um grande sucesso na comunidade.

Este evento ===especial=== reuniu centenas de pessoas no CRAS I, localizado no bairro Germano em Piripiri.

A festa contou com música ao vivo, dança e muita alegria. ===Foram mais de 300 participantes=== de todas as idades.

O evento foi ===totalmente gratuito=== e contou com apoio da Prefeitura Municipal.

### Principais atrações
• Música ao vivo com a banda local
• Apresentações de dança
• Comidas típicas
• Atividades recreativas

> "Foi uma experiência inesquecível para toda a comunidade", disse a coordenadora do evento.

A próxima edição já está sendo planejada para o próximo ano.`;

console.log('🔄 Atualizando matéria 21 com conteúdo de teste...');

db.run(
  'UPDATE noticias SET conteudo = ? WHERE id = 21',
  [contentWithHighlight],
  function(err) {
    if (err) {
      console.error('❌ Erro:', err);
    } else {
      console.log('✅ Matéria 21 atualizada com highlights animados!');
      console.log(`📊 ${this.changes} linha(s) alterada(s)`);
    }
    db.close();
  }
);