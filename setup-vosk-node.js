const https = require('https');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { createWriteStream, createReadStream } = require('fs');
const { Extract } = require('unzipper');

const MODEL_DIR = path.join(__dirname, 'models');
const MODEL_NAME = 'vosk-model-small-es-0.42';
const MODEL_URL = `https://alphacephei.com/vosk/models/${MODEL_NAME}.zip`;
const MODEL_ZIP = path.join(MODEL_DIR, `${MODEL_NAME}.zip`);

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Seguir redirección
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const percent = ((downloaded / totalSize) * 100).toFixed(2);
        process.stdout.write(`\r⬇️  Descargando: ${percent}%`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n✅ Descarga completada');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function unzipFile(src, dest) {
  return new Promise((resolve, reject) => {
    createReadStream(src)
      .pipe(Extract({ path: dest }))
      .on('close', resolve)
      .on('error', reject);
  });
}

async function main() {
  console.log('🚀 Descargando modelo de transcripción gratuito (Vosk)...');
  console.log('📦 Tamaño aproximado: ~50 MB\n');

  // Crear directorio
  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  try {
    // Descargar
    console.log('⬇️  Iniciando descarga...');
    await downloadFile(MODEL_URL, MODEL_ZIP);

    // Descomprimir
    console.log('📂 Descomprimiendo modelo...');
    await unzipFile(MODEL_ZIP, MODEL_DIR);
    console.log('✅ Modelo descomprimido');

    // Limpiar
    console.log('🗑️  Limpiando archivos temporales...');
    fs.unlinkSync(MODEL_ZIP);

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ¡Instalación completada!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Próximos pasos:');
    console.log('   1. Reinicia la aplicación:');
    console.log('      docker compose down && docker compose up --build -d');
    console.log('');
    console.log('   2. Sube un archivo de audio/video');
    console.log('');
    console.log('   3. ¡Disfruta de transcripción GRATUITA!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Verifica tu conexión a internet');
    process.exit(1);
  }
}

main();
