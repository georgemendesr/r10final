const fs = require('fs');
const path = require('path');
const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();

const BACKUP_PATH = path.join(__dirname, '../backup/r10.db');
const DB_PATH = path.join(__dirname, '../arquivo.db');

// Abrir banco
const db = new sqlite3.Database(DB_PATH);

console.log('🔄 Iniciando importação v4 (line-by-line)...\n');

// Ler arquivo linha por linha
const fileStream = fs.createReadStream(BACKUP_PATH, { encoding: 'utf8' });
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

let dentroBlocoNoticias = false;
let linhasValores = [];

rl.on('line', (linha) => {
    // Detectar início do bloco notícias
    if (linha.includes('INSERT INTO `noticias`')) {
        dentroBlocoNoticias = true;
        return;
    }
    
    // Se estiver dentro do bloco, capturar linhas de valores
    if (dentroBlocoNoticias) {
        // Fim do bloco quando encontrar nova tabela ou novo INSERT
        if (linha.startsWith('INSERT INTO ') || linha.startsWith('CREATE TABLE') || linha.startsWith('--')) {
            dentroBlocoNoticias = false;
            return;
        }
        
        // Capturar linha de valor (começa com '(' ou números)
        const trimmed = linha.trim();
        if (trimmed.startsWith('(') || /^\d+,/.test(trimmed)) {
            linhasValores.push(linha);
        }
    }
});

rl.on('close', () => {
    console.log(`📦 Total de linhas de valores capturadas: ${linhasValores.length}\n`);
    
    if (linhasValores.length === 0) {
        console.log('❌ Nenhuma linha capturada!');
        process.exit(1);
    }
    
    // Limpar banco
    console.log('🗑️  Limpando banco...');
    db.run('DELETE FROM noticias', (err) => {
        if (err) {
            console.error('❌ Erro ao limpar:', err);
            process.exit(1);
        }
        
        console.log('✅ Banco limpo!\n💾 Importando registros...\n');
        
        let importados = 0;
        let erros = 0;
        
        // Função para limpar valor
        function limparValor(valor) {
            if (!valor) return null;
            if (valor === 'NULL' || valor === 'null') return null;
            
            // Remove aspas externas
            if ((valor.startsWith("'") && valor.endsWith("'")) ||
                (valor.startsWith('"') && valor.endsWith('"'))) {
                valor = valor.substring(1, valor.length - 1);
            }
            
            // Decodifica escapes SQL
            valor = valor
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            
            // Decodifica HTML entities
            const entities = {
                '&nbsp;': ' ',
                '&quot;': '"',
                '&apos;': "'",
                '&lt;': '<',
                '&gt;': '>',
                '&amp;': '&',
                '&ccedil;': 'ç',
                '&Ccedil;': 'Ç',
                '&atilde;': 'ã',
                '&Atilde;': 'Ã',
                '&aacute;': 'á',
                '&Aacute;': 'Á',
                '&acirc;': 'â',
                '&Acirc;': 'Â',
                '&agrave;': 'à',
                '&Agrave;': 'À',
                '&eacute;': 'é',
                '&Eacute;': 'É',
                '&ecirc;': 'ê',
                '&Ecirc;': 'Ê',
                '&iacute;': 'í',
                '&Iacute;': 'Í',
                '&oacute;': 'ó',
                '&Oacute;': 'Ó',
                '&ocirc;': 'ô',
                '&Ocirc;': 'Ô',
                '&otilde;': 'õ',
                '&Otilde;': 'Õ',
                '&uacute;': 'ú',
                '&Uacute;': 'Ú',
                '&ucirc;': 'û',
                '&Ucirc;': 'Û',
                '&ordm;': 'º',
                '&ordf;': 'ª',
                '&deg;': '°',
                '&ldquo;': '"',
                '&rdquo;': '"',
                '&lsquo;': "'",
                '&rsquo;': "'",
                '&ndash;': '–',
                '&mdash;': '—',
                '&hellip;': '…'
            };
            
            // Substitui todas as entities
            for (const [entity, char] of Object.entries(entities)) {
                valor = valor.replace(new RegExp(entity, 'g'), char);
            }
            
            // Decodifica entities numéricas &#123;
            valor = valor.replace(/&#(\d+);/g, (match, num) => String.fromCharCode(num));
            
            // Decodifica entities hexadecimais &#x1a;
            valor = valor.replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
            
            return valor;
        }
        
        // SQL de inserção
        const sql = `INSERT INTO noticias (titulo, conteudo, imagem, data_publicacao, autor, categoria, views) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        const stmt = db.prepare(sql);
        
        // Processar cada linha
        linhasValores.forEach((linha, idx) => {
            try {
                // Remover parênteses e vírgula final
                let valores = linha.trim();
                if (valores.startsWith('(')) valores = valores.substring(1);
                if (valores.endsWith('),')) valores = valores.substring(0, valores.length - 2);
                if (valores.endsWith(');')) valores = valores.substring(0, valores.length - 2);
                if (valores.endsWith(')')) valores = valores.substring(0, valores.length - 1);
                
                // Parse simples: split por vírgula, mas respeitando strings
                const campos = [];
                let atual = '';
                let dentroString = false;
                let escapado = false;
                
                for (let i = 0; i < valores.length; i++) {
                    const c = valores[i];
                    
                    if (escapado) {
                        atual += c;
                        escapado = false;
                        continue;
                    }
                    
                    if (c === '\\') {
                        escapado = true;
                        atual += c;
                        continue;
                    }
                    
                    if (c === "'" && !dentroString) {
                        dentroString = true;
                        continue;
                    } else if (c === "'" && dentroString) {
                        dentroString = false;
                        continue;
                    }
                    
                    if (c === ',' && !dentroString) {
                        campos.push(atual.trim());
                        atual = '';
                        continue;
                    }
                    
                    atual += c;
                }
                
                // Último campo
                if (atual.trim()) {
                    campos.push(atual.trim());
                }
                
                // Mapear colunas corretas
                const titulo = limparValor(campos[5]); // campo 5 = titulo
                const conteudo = limparValor(campos[10]); // campo 10 = texto
                const imagem = limparValor(campos[7]); // campo 7 = foto
                let data = limparValor(campos[20]); // campo 20 = data_entrada
                const autor = limparValor(campos[13]); // campo 13 = redator
                const categoria = limparValor(campos[4]); // campo 4 = chapeu
                const views = parseInt(limparValor(campos[9]) || '0'); // campo 9 = visualizacoes
                
                // Garantir que a data está no formato correto do SQLite (YYYY-MM-DD HH:MM:SS)
                // MySQL usa formato: 2019-02-08 16:10:29
                if (data && data.includes(' ')) {
                    // Já está no formato correto YYYY-MM-DD HH:MM:SS
                    // SQLite aceita esse formato diretamente
                } else if (data) {
                    // Se vier só a data, adiciona horário
                    data = data + ' 00:00:00';
                }
                
                stmt.run([titulo, conteudo, imagem, data, autor, categoria, views], (err) => {
                    if (err) {
                        erros++;
                    } else {
                        importados++;
                    }
                    
                    if ((importados + erros) % 100 === 0) {
                        process.stdout.write(`\r✅ Importados: ${importados} | ❌ Erros: ${erros}`);
                    }
                    
                    // Se terminou
                    if (importados + erros === linhasValores.length) {
                        stmt.finalize();
                        console.log(`\n\n🎉 Importação concluída!`);
                        console.log(`✅ Notícias importadas: ${importados}`);
                        console.log(`❌ Erros: ${erros}`);
                        
                        // Verificar amostra
                        db.get('SELECT titulo, autor, categoria, data_publicacao FROM noticias LIMIT 1', (err, row) => {
                            if (row) {
                                console.log('\n📰 Primeira notícia importada:');
                                console.log(`   Título: ${row.titulo}`);
                                console.log(`   Autor: ${row.autor}`);
                                console.log(`   Categoria: ${row.categoria}`);
                                console.log(`   Data: ${row.data_publicacao}`);
                            }
                            db.close();
                        });
                    }
                });
            } catch (err) {
                erros++;
                console.error(`\nErro na linha ${idx}:`, err.message);
            }
        });
    });
});
