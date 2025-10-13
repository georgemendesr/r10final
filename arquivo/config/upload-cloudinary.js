const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// ====================================
// CONFIGURE SUAS CREDENCIAIS AQUI
// ====================================
cloudinary.config({
  cloud_name: 'dd6ln5xmu',
  api_key: '581861181724356',
  api_secret: 'N5GksYTkAN339of03H20SAAh2jY'
});

// ====================================
// CONFIGURAÇÕES
// ====================================
const BATCH_SIZE = 100; // Upload 100 imagens por vez (10x mais rápido!)
const PROGRESS_FILE = path.join(__dirname, 'upload-progress.json');
const DB_PATH = path.join(__dirname, '../arquivo.db');

// Pastas para upload
const FOLDERS = [
  {
    local: path.join(__dirname, '../uploads/imagens'),
    cloudinary: 'arquivo/uploads/imagens',
    dbField: 'imagem'
  },
  {
    local: path.join(__dirname, '../uploads/editor'),
    cloudinary: 'arquivo/uploads/editor',
    dbField: null // Editor images não estão no DB como campo principal
  }
];

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { uploaded: [], failed: [], lastIndex: 0 };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function getAllFiles(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFiles(filePath));
      } else {
        // Apenas arquivos de imagem
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
          results.push(filePath);
        }
      }
    });
  } catch (err) {
    console.error(`Erro ao ler diretório ${dir}:`, err.message);
  }
  return results;
}

function uploadToCloudinary(filePath, cloudinaryFolder) {
  return new Promise((resolve) => {
    const relativePath = filePath.split('uploads')[1].replace(/\\/g, '/');
    const publicId = path.basename(filePath, path.extname(filePath));
    
    cloudinary.uploader.upload(filePath, {
      folder: cloudinaryFolder,
      public_id: publicId,
      resource_type: 'auto',
      timeout: 60000
    }, (error, result) => {
      if (error) {
        resolve({ success: false, error: error.message, path: filePath });
      } else {
        resolve({ 
          success: true, 
          url: result.secure_url, 
          path: filePath,
          relativePath: relativePath 
        });
      }
    });
  });
}

async function uploadBatch(files, cloudinaryFolder, startIndex, progress) {
  const batch = files.slice(startIndex, startIndex + BATCH_SIZE);
  
  if (batch.length === 0) {
    return { completed: true };
  }

  console.log(`\n📤 Uploading batch ${Math.floor(startIndex / BATCH_SIZE) + 1} (${startIndex + 1}-${startIndex + batch.length} de ${files.length})`);

  const promises = batch.map(file => uploadToCloudinary(file, cloudinaryFolder));
  const results = await Promise.all(promises);

  results.forEach(result => {
    if (result.success) {
      progress.uploaded.push({
        local: result.path,
        cloudinary: result.url,
        relativePath: result.relativePath
      });
      console.log(`  ✅ ${path.basename(result.path)}`);
    } else {
      progress.failed.push({
        path: result.path,
        error: result.error
      });
      console.log(`  ❌ ${path.basename(result.path)}: ${result.error}`);
    }
  });

  progress.lastIndex = startIndex + batch.length;
  saveProgress(progress);

  return { completed: false, nextIndex: startIndex + BATCH_SIZE };
}

async function updateDatabase(progress) {
  console.log('\n📊 Atualizando banco de dados...');
  
  const db = new sqlite3.Database(DB_PATH);

  return new Promise((resolve, reject) => {
    let updated = 0;
    let errors = 0;

    db.serialize(() => {
      progress.uploaded.forEach(item => {
        // Extrai o nome do arquivo da URL do Cloudinary
        const filename = path.basename(item.relativePath);
        
        db.run(
          `UPDATE noticias 
           SET imagem = ? 
           WHERE imagem LIKE ?`,
          [item.cloudinary, `%${filename}%`],
          function(err) {
            if (err) {
              errors++;
              console.error(`  ❌ Erro ao atualizar ${filename}:`, err.message);
            } else if (this.changes > 0) {
              updated++;
              console.log(`  ✅ ${filename} - ${this.changes} registro(s) atualizado(s)`);
            }
          }
        );
      });
    });

    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`\n✅ Database atualizada: ${updated} registros, ${errors} erros`);
        resolve({ updated, errors });
      }
    });
  });
}

// ====================================
// MAIN FUNCTION
// ====================================

async function main() {
  console.log('🚀 INICIANDO UPLOAD PARA CLOUDINARY\n');
  console.log('================================');
  console.log(`Cloud Name: ${cloudinary.config().cloud_name}`);
  console.log(`Batch Size: ${BATCH_SIZE} imagens por vez`);
  console.log('================================\n');

  const progress = loadProgress();
  console.log(`📋 Progresso carregado: ${progress.uploaded.length} já enviadas\n`);

  for (const folder of FOLDERS) {
    console.log(`\n📁 Processando: ${folder.cloudinary}`);
    console.log('━'.repeat(50));

    // Obter todos os arquivos
    const allFiles = getAllFiles(folder.local);
    console.log(`📊 Total de arquivos encontrados: ${allFiles.length}`);

    // Filtrar arquivos já enviados
    const uploadedPaths = new Set(progress.uploaded.map(u => u.local));
    const filesToUpload = allFiles.filter(f => !uploadedPaths.has(f));
    
    console.log(`⏭️  Já enviados: ${allFiles.length - filesToUpload.length}`);
    console.log(`📤 Restantes: ${filesToUpload.length}\n`);

    if (filesToUpload.length === 0) {
      console.log('✅ Todos os arquivos desta pasta já foram enviados!\n');
      continue;
    }

    // Upload em batches
    let currentIndex = 0;
    let completed = false;

    while (!completed) {
      const result = await uploadBatch(filesToUpload, folder.cloudinary, currentIndex, progress);
      completed = result.completed;
      currentIndex = result.nextIndex || 0;

      // Pequena pausa entre batches para não sobrecarregar
      if (!completed) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Relatório final
  console.log('\n\n🎉 UPLOAD CONCLUÍDO!');
  console.log('================================');
  console.log(`✅ Sucesso: ${progress.uploaded.length} arquivos`);
  console.log(`❌ Falhas: ${progress.failed.length} arquivos`);
  console.log('================================\n');

  if (progress.failed.length > 0) {
    console.log('⚠️  Arquivos com falha:');
    progress.failed.forEach(f => {
      console.log(`  - ${path.basename(f.path)}: ${f.error}`);
    });
    console.log('\n');
  }

  // Atualizar banco de dados
  if (progress.uploaded.length > 0) {
    try {
      await updateDatabase(progress);
      console.log('\n✅ Processo completo! Banco de dados atualizado.');
    } catch (err) {
      console.error('\n❌ Erro ao atualizar banco de dados:', err.message);
    }
  }

  console.log('\n📝 Progresso salvo em: upload-progress.json');
  console.log('💡 Para recomeçar do zero, delete esse arquivo.\n');
}

// Executar
main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
