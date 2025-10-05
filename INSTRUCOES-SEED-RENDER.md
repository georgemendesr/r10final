# Script para Popular Banco no Render

Execute estes comandos no **Render Shell** (acesse pelo painel do Render):

## 1. Criar arquivo seed no servidor

```bash
cat > /tmp/seed-render.js << 'EOFSCRIPT'
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = process.env.SQLITE_DB_PATH || '/opt/render/project/src/data/noticias.db';
console.log('Conectando:', DB_PATH);
const db = new sqlite3.Database(DB_PATH);

const noticias = [
  {titulo: 'Governo do Piauí anuncia investimento de R$ 500 milhões em infraestrutura', chapeu: 'Desenvolvimento', resumo: 'Recursos serão destinados para pavimentação de rodovias, construção de escolas e hospitais em 12 municípios do interior', conteudo: '<p>O governador do Piauí anunciou nesta sexta-feira (4) um pacote de investimentos de R$ 500 milhões para obras de infraestrutura em 12 municípios do interior do estado. O anúncio foi feito durante cerimônia no Palácio de Karnak.</p><p>Os recursos serão destinados para pavimentação de rodovias estaduais, construção de três novos hospitais regionais, ampliação de escolas e obras de saneamento básico.</p>', autor: 'João Silva', categoria: 'politica', posicao: 1, destaque: 1},
  {titulo: 'Piripiri recebe primeira indústria de tecnologia do interior', chapeu: 'Economia', resumo: 'Empresa vai gerar 150 empregos diretos e investir R$ 20 milhões no município', conteudo: '<p>Piripiri ganhou sua primeira indústria de tecnologia nesta semana. A empresa TechNorte inaugurou sua sede no distrito industrial da cidade.</p>', autor: 'Maria Santos', categoria: 'piripiri', posicao: 2, destaque: 1},
  {titulo: 'Festival de Verão movimenta economia local em 15 municípios', chapeu: 'Cultura', resumo: 'Evento deve atrair mais de 50 mil visitantes e gerar R$ 10 milhões em receita', conteudo: '<p>O Festival de Verão do Piauí promete movimentar a economia local com shows e feiras gastronômicas.</p>', autor: 'Carlos Mendes', categoria: 'entretenimento', posicao: 3, destaque: 1},
  {titulo: 'Universidade abre inscrições para 500 vagas em cursos gratuitos', chapeu: 'Educação', resumo: 'Cursos técnicos e de graduação estão disponíveis em Teresina e mais 8 cidades', conteudo: '<p>A UESPI abriu inscrições para 500 vagas em cursos gratuitos.</p>', autor: 'Ana Paula', categoria: 'geral', posicao: 4, destaque: 1},
  {titulo: 'Operação policial prende 12 suspeitos de tráfico em Teresina', chapeu: 'Segurança', resumo: 'Apreendidas drogas, armas e veículos em ação coordenada da polícia civil', conteudo: '<p>Uma operação da Polícia Civil resultou na prisão de 12 suspeitos de tráfico.</p>', autor: 'Roberto Lima', categoria: 'policia', posicao: 5, destaque: 1},
  {titulo: 'Seleção piauiense de futsal conquista título nacional sub-17', chapeu: 'Esporte', resumo: 'Time venceu São Paulo por 4 a 2 na final disputada em Brasília', conteudo: '<p>A seleção piauiense de futsal sub-17 conquistou o título nacional.</p>', autor: 'Fernando Costa', categoria: 'esporte', posicao: 6, destaque: 1},
  {titulo: 'Chuvas atingem 12 municípios do interior do Piauí', chapeu: 'Clima', resumo: 'Defesa Civil emite alerta para possíveis alagamentos', conteudo: '<p>Fortes chuvas atingiram 12 municípios do interior.</p>', autor: 'Paula Rodrigues', categoria: 'geral', posicao: 0, destaque: 0},
  {titulo: 'Preço da gasolina cai 5% em postos de Teresina', chapeu: 'Economia', resumo: 'Redução reflete queda no preço do petróleo', conteudo: '<p>O preço da gasolina caiu em média 5% nos postos de Teresina.</p>', autor: 'Marcos Oliveira', categoria: 'geral', posicao: 0, destaque: 0},
  {titulo: 'Hospital Regional de Picos amplia leitos de UTI', chapeu: 'Saúde', resumo: 'Unidade passa de 10 para 20 leitos', conteudo: '<p>O Hospital Regional de Picos inaugurou 10 novos leitos de UTI.</p>', autor: 'Juliana Barros', categoria: 'geral', posicao: 0, destaque: 0},
  {titulo: 'Feira de artesanato reúne 200 expositores em Parnaíba', chapeu: 'Cultura', resumo: 'Evento acontece no fim de semana e tem entrada gratuita', conteudo: '<p>A 15ª Feira de Artesanato de Parnaíba reúne 200 expositores.</p>', autor: 'Ricardo Alves', categoria: 'entretenimento', posicao: 0, destaque: 0},
  {titulo: 'Concurso público oferece 300 vagas para professores', chapeu: 'Emprego', resumo: 'Inscrições começam na próxima semana', conteudo: '<p>A Secretaria de Educação lançou edital com 300 vagas.</p>', autor: 'Beatriz Lima', categoria: 'geral', posicao: 0, destaque: 0},
  {titulo: 'Pedro II recebe obras de pavimentação no centro histórico', chapeu: 'Infraestrutura', resumo: 'Investimento de R$ 2 milhões vai beneficiar comércio local', conteudo: '<p>Pedro II iniciou obras de pavimentação.</p>', autor: 'Antônio Sousa', categoria: 'pedro-ii', posicao: 0, destaque: 0},
  {titulo: 'Piracuruca inaugura novo mercado público', chapeu: 'Comércio', resumo: 'Espaço moderno tem 80 boxes', conteudo: '<p>Piracuruca inaugurou seu novo mercado público.</p>', autor: 'Carla Mendes', categoria: 'piracuruca', posicao: 0, destaque: 0},
  {titulo: 'Campo Maior realiza tradicional Festa do Bode', chapeu: 'Tradição', resumo: 'Evento celebra 30 anos', conteudo: '<p>Campo Maior se prepara para a 30ª edição da Festa do Bode.</p>', autor: 'José Carlos', categoria: 'campo-maior', posicao: 0, destaque: 0},
  {titulo: 'Barras investe em turismo rural com novas trilhas', chapeu: 'Turismo', resumo: 'Projeto quer atrair visitantes', conteudo: '<p>Barras lançou projeto de turismo rural.</p>', autor: 'Sandra Martins', categoria: 'barras', posicao: 0, destaque: 0}
];

const banners = [
  {titulo: 'Banner Supermercado Economix', cliente: 'Supermercado Economix', link: 'https://exemplo.com/economix', posicao: 'topo', tipo: 'imagem', tamanho: '970x90', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 5, conteudo_html: '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;"><h2>🛒 ECONOMIX - Ofertas!</h2></div>'},
  {titulo: 'Banner TechPi', cliente: 'TechPi Informática', link: 'https://exemplo.com/techpi', posicao: 'topo', tipo: 'imagem', tamanho: '970x90', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 4, conteudo_html: '<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; text-align: center; color: white;"><h2>💻 TechPi</h2></div>'},
  {titulo: 'Banner Farmácia Saúde Total', cliente: 'Farmácia Saúde Total', link: 'https://exemplo.com/saudetotal', posicao: 'sidebar', tipo: 'imagem', tamanho: '300x250', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 5, conteudo_html: '<div style="background: #4facfe; padding: 15px; text-align: center; color: white; height: 250px; display: flex; flex-direction: column; justify-content: center;"><h3>💊 Saúde Total</h3></div>'},
  {titulo: 'Banner Pizzaria Bella Massa', cliente: 'Pizzaria Bella Massa', link: 'https://exemplo.com/bellamassa', posicao: 'sidebar', tipo: 'imagem', tamanho: '300x250', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 4, conteudo_html: '<div style="background: #fa709a; padding: 15px; text-align: center; height: 250px; display: flex; flex-direction: column; justify-content: center;"><h3>🍕 Bella Massa</h3></div>'},
  {titulo: 'Banner Auto Peças', cliente: 'Auto Peças Piauí', link: 'https://exemplo.com/autopecas', posicao: 'sidebar', tipo: 'imagem', tamanho: '300x250', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 3, conteudo_html: '<div style="background: #30cfd0; padding: 15px; text-align: center; color: white; height: 250px; display: flex; flex-direction: column; justify-content: center;"><h3>🚗 Auto Peças</h3></div>'},
  {titulo: 'Banner Móveis Design', cliente: 'Móveis Design', link: 'https://exemplo.com/moveisdesign', posicao: 'meio-conteudo', tipo: 'imagem', tamanho: '728x90', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 5, conteudo_html: '<div style="background: #a8edea; padding: 15px; text-align: center;"><h3>🛋️ Móveis Design</h3></div>'},
  {titulo: 'Banner OdontoVida', cliente: 'Clínica OdontoVida', link: 'https://exemplo.com/odontovida', posicao: 'meio-conteudo', tipo: 'imagem', tamanho: '728x90', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 4, conteudo_html: '<div style="background: #ffecd2; padding: 15px; text-align: center;"><h3>😁 OdontoVida</h3></div>'},
  {titulo: 'Banner Construtora Forte', cliente: 'Construtora Forte', link: 'https://exemplo.com/construtoraforte', posicao: 'rodape', tipo: 'imagem', tamanho: '970x90', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 5, conteudo_html: '<div style="background: #ff9a9e; padding: 20px; text-align: center;"><h2>🏗️ Construtora Forte</h2></div>'},
  {titulo: 'Banner Unifuturo', cliente: 'Faculdade Unifuturo', link: 'https://exemplo.com/unifuturo', posicao: 'rodape', tipo: 'imagem', tamanho: '970x90', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 4, conteudo_html: '<div style="background: #84fab0; padding: 20px; text-align: center;"><h2>🎓 Unifuturo</h2></div>'},
  {titulo: 'Banner FitLife Academia', cliente: 'Academia FitLife', link: 'https://exemplo.com/fitlife', posicao: 'entre-materias', tipo: 'imagem', tamanho: '336x280', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 5, conteudo_html: '<div style="background: #ff6b6b; padding: 20px; text-align: center; color: white; height: 280px; display: flex; flex-direction: column; justify-content: center;"><h3>💪 FitLife</h3></div>'},
  {titulo: 'Banner Pet Shop Amigo Fiel', cliente: 'Pet Shop Amigo Fiel', link: 'https://exemplo.com/amigofiel', posicao: 'entre-materias', tipo: 'imagem', tamanho: '336x280', status: 'ativo', data_inicio: '2025-10-01', data_fim: '2025-12-31', prioridade: 4, conteudo_html: '<div style="background: #a1c4fd; padding: 20px; text-align: center; height: 280px; display: flex; flex-direction: column; justify-content: center;"><h3>🐶 Pet Shop</h3></div>'}
];

db.serialize(() => {
  const stmtNot = db.prepare('INSERT INTO noticias (titulo,chapeu,resumo,conteudo,autor,categoria,posicao,destaque,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,datetime("now"),datetime("now"))');
  noticias.forEach(n => stmtNot.run(n.titulo, n.chapeu, n.resumo, n.conteudo, n.autor, n.categoria, n.posicao, n.destaque));
  stmtNot.finalize(() => console.log('✅ Notícias inseridas:', noticias.length));

  const stmtBan = db.prepare('INSERT INTO banners (titulo,cliente,link,posicao,tipo,tamanho,status,data_inicio,data_fim,prioridade,conteudo_html,impressoes_atuais,cliques_atuais,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,0,datetime("now"),datetime("now"))');
  banners.forEach(b => stmtBan.run(b.titulo, b.cliente, b.link, b.posicao, b.tipo, b.tamanho, b.status, b.data_inicio, b.data_fim, b.prioridade, b.conteudo_html));
  stmtBan.finalize(() => {
    console.log('✅ Banners inseridos:', banners.length);
    db.close(() => console.log('✅ Concluído!'));
  });
});
EOFSCRIPT
```

## 2. Executar o script

```bash
node /tmp/seed-render.js
```

## 3. Verificar resultados

```bash
# Verificar notícias
echo "SELECT COUNT(*) FROM noticias;" | sqlite3 $SQLITE_DB_PATH

# Verificar banners
echo "SELECT COUNT(*) FROM banners;" | sqlite3 $SQLITE_DB_PATH
```

---

## Alternativa: Via curl (sem Shell)

Se preferir, pode usar curl direto da sua máquina (necessário criar usuário admin primeiro):

```bash
# 1. Login
curl -X POST https://r10piaui.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@r10.com","password":"sua_senha"}'

# 2. Criar posts (use o token retornado)
curl -X POST https://r10piaui.onrender.com/api/posts \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Primeira notícia","chapeu":"Chapéu","resumo":"Resumo","conteudo":"<p>Conteúdo</p>","autor":"Redação","categoria":"geral","posicao":1,"destaque":true}'
```

## Melhor opção: Usar Render Shell

1. Acesse https://dashboard.render.com
2. Clique no seu Web Service "r10piaui"
3. Clique na aba **Shell** (canto superior direito)
4. Cole o código do passo 1 e execute
5. Aguarde confirmação
6. Recarregue o site!

🎯 **Recomendo usar o Render Shell - é rápido e seguro!**
