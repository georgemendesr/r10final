const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const BACKUP_PATH = path.join(__dirname, '../backup/r10.db');
const DB_PATH = path.join(__dirname, '../arquivo.db');

// Abrir banco
const db = new sqlite3.Database(DB_PATH);

console.log('🔄 Iniciando importação v3 (multi-line parser)...\n');

// Ler o arquivo completo
const conteudo = fs.readFileSync(BACKUP_PATH, 'utf8');

// Encontrar TODOS os blocos INSERT INTO `noticias`
const regex = /INSERT INTO `noticias`[^;]*;/gs;
const matches = conteudo.match(regex);

if (!matches || matches.length === 0) {
    console.log('❌ Não encontrou INSERT INTO `noticias`');
    process.exit(1);
}

console.log(`📦 Encontrados ${matches.length} blocos INSERT INTO \`noticias\`\n`);
console.log('🔍 Parseando todos os blocos...\n');

// Parser de valores com suporte a strings complexas
function parseValues(text) {
    const records = [];
    let pos = 0;
    let recordCount = 0;
    
    while (pos < text.length) {
        // Pular espaços e quebras de linha
        while (pos < text.length && (text[pos] === ' ' || text[pos] === '\n' || text[pos] === '\r')) {
            pos++;
        }
        
        // Se chegou ao fim ou encontrou ;
        if (pos >= text.length || text[pos] === ';') break;
        
        // Se encontrou vírgula solta, pula (separador entre registros)
        if (text[pos] === ',') {
            pos++;
            continue;
        }
        
        // Deve começar com (
        if (text[pos] !== '(') {
            pos++;
            continue;
        }
        
        pos++; // pula (
        const campos = [];
        let campo = '';
        let dentroString = false;
        let escapado = false;
        let parentesesLevel = 1; // já entramos em um (
        
        while (pos < text.length && parentesesLevel > 0) {
            const char = text[pos];
            
            if (escapado) {
                campo += char;
                escapado = false;
                pos++;
                continue;
            }
            
            if (char === '\\') {
                escapado = true;
                campo += char;
                pos++;
                continue;
            }
            
            if (char === "'" && !dentroString) {
                dentroString = true;
                pos++;
                continue;
            } else if (char === "'" && dentroString) {
                dentroString = false;
                pos++;
                continue;
            }
            
            if (dentroString) {
                campo += char;
                pos++;
                continue;
            }
            
            // Fora de string
            if (char === '(') {
                parentesesLevel++;
                campo += char;
            } else if (char === ')') {
                parentesesLevel--;
                if (parentesesLevel === 0) {
                    // Fim do registro
                    if (campo.trim() !== '') {
                        campos.push(campo.trim());
                    }
                    break;
                } else {
                    campo += char;
                }
            } else if (char === ',' && parentesesLevel === 1) {
                // Fim de um campo
                campos.push(campo.trim());
                campo = '';
            } else {
                campo += char;
            }
            
            pos++;
        }
        
        if (campos.length > 0) {
            records.push(campos);
            recordCount++;
            
            if (recordCount % 1000 === 0) {
                process.stdout.write(`\r📊 Parseados: ${recordCount}`);
            }
        }
    }
    
    if (recordCount < 1000) {
        console.log(`📊 Total parseados: ${recordCount}`);
    } else {
        console.log(`\r📊 Total parseados: ${recordCount}            `);
    }
    return records;
}

// Processar cada bloco separadamente e combinar todos os registros
let allRecords = [];

matches.forEach((bloco, blocoIdx) => {
    const posValues = bloco.indexOf('VALUES');
    if (posValues !== -1) {
        const valuesText = bloco.substring(posValues + 6);
        const records = parseValues(valuesText);
        allRecords = allRecords.concat(records);
        
        if ((blocoIdx + 1) % 50 === 0) {
            process.stdout.write(`\r📊 Processados: ${blocoIdx + 1}/${matches.length} blocos (${allRecords.length} registros)`);
        }
    }
});

console.log(`\r📊 Total processados: ${matches.length} blocos = ${allRecords.length} registros          `);

console.log(`\n✅ Registros extraídos: ${allRecords.length}`);

if (allRecords.length === 0) {
    console.log('❌ Nenhum registro encontrado!');
    process.exit(1);
}

// Verificar primeiro registro
console.log('\n🔍 Primeiro registro (primeiros 6 campos):');
if (allRecords[0]) {
    for (let i = 0; i < Math.min(6, allRecords[0].length); i++) {
        const val = allRecords[0][i];
        const preview = val.length > 60 ? val.substring(0, 60) + '...' : val;
        console.log(`  [${i}]: ${preview}`);
    }
}

// Limpar banco
console.log('\n🗑️  Limpando banco...');
db.run('DELETE FROM noticias', (err) => {
    if (err) {
        console.error('❌ Erro ao limpar:', err);
        process.exit(1);
    }
    
    console.log('✅ Banco limpo!');
    console.log('\n💾 Importando registros...\n');
    
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
        
        // Decodifica escapes
        valor = valor
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        
        return valor;
    }
    
    // SQL de inserção
    const sql = `INSERT INTO noticias (titulo, conteudo, imagem, data_publicacao, autor, categoria, views) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const stmt = db.prepare(sql);
    
    // Processar cada registro
    allRecords.forEach((campos, idx) => {
        try {
            // Mapear colunas corretas
            const titulo = limparValor(campos[5]); // campo 5 = titulo
            const conteudo = limparValor(campos[10]); // campo 10 = texto
            const imagem = limparValor(campos[7]); // campo 7 = foto
            const data = limparValor(campos[20]); // campo 20 = data_entrada
            const autor = limparValor(campos[13]); // campo 13 = redator
            const categoria = limparValor(campos[4]); // campo 4 = chapeu
            const views = parseInt(limparValor(campos[9]) || '0'); // campo 9 = visualizacoes
            
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
                if (importados + erros === allRecords.length) {
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
            console.error(`\nErro no registro ${idx}:`, err.message);
        }
    });
});
