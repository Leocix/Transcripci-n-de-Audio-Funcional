const fs = require('fs');
const path = require('path');

/**
 * transcribeFile usando Hugging Face (GRATIS)
 * Usa el modelo openai/whisper-large-v3 de Hugging Face
 * Solo necesitas un token GRATUITO de Hugging Face
 */
async function transcribeFile(filePath, opts = { verbose: false }) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️ HUGGINGFACE_API_KEY no configurado - Usando modo demostración');
    return generateDemoText(filePath);
  }

  console.log('🚀 Transcribiendo con Hugging Face (GRATIS)...');
  
  try {
    const { HfInference } = require('@huggingface/inference');
    const hf = new HfInference(apiKey);
    
    // Leer el archivo de audio
    const audioBuffer = fs.readFileSync(filePath);
    
    // Transcribir usando Whisper de Hugging Face
    const result = await hf.automaticSpeechRecognition({
      data: audioBuffer,
      model: 'openai/whisper-large-v3'
    });
    
    console.log('✅ Transcripción completada con Hugging Face');
    
    return {
      text: result.text || 'No se pudo transcribir el audio',
      segments: null,
      raw: result
    };
    
  } catch (error) {
    console.error('❌ Error con Hugging Face:', error.message);
    
    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      return {
        text: `⏳ Límite de uso alcanzado temporalmente.

Hugging Face tiene límites de uso gratuito. Opciones:

1️⃣ ESPERA unos minutos y vuelve a intentar
2️⃣ USA la grabación en tiempo real (sin límites)
3️⃣ CREA una cuenta nueva en Hugging Face y usa otro token

💡 La grabación en tiempo real no tiene límites y es igual de precisa.`,
        segments: null
      };
    }
    
    if (error.message?.includes('401') || error.message?.includes('invalid')) {
      return {
        text: `🔑 Token de Hugging Face inválido o expirado.

Pasos para obtener un token GRATIS:

1. Ve a: https://huggingface.co/settings/tokens
2. Click en "New token"
3. Dale un nombre (ej: "transcripcion")
4. Selecciona "read" como tipo
5. Copia el token
6. Edita el archivo .env y agrega:
   HUGGINGFACE_API_KEY=tu-token-aqui
7. Reinicia: docker compose down && docker compose up --build -d

💡 Mientras tanto, usa la grabación en tiempo real.`,
        segments: null
      };
    }
    
    return {
      text: `Error: ${error.message}\n\n💡 Usa la grabación en tiempo real como alternativa.`,
      segments: null
    };
  }
}

function generateDemoText(filePath) {
  const fileName = path.basename(filePath);
  const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
  
  return {
    text: `📄 Archivo: ${fileName} (${fileSizeMB} MB)
📅 Fecha: ${new Date().toLocaleString('es-ES')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ TOKEN DE HUGGING FACE NO CONFIGURADO

Para transcribir archivos necesitas configurar un token de Hugging Face.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 CÓMO OBTENER TOKEN (2 minutos, gratis):

1. Crear cuenta: https://huggingface.co/join
   • NO requiere tarjeta de crédito
   • Usa email o cuenta de Google

2. Generar token: https://huggingface.co/settings/tokens
   • Click "New token"
   • Nombre: "transcripcion"
   • Tipo: "read"
   • Copiar token (empieza con "hf_...")

3. Configurar (PowerShell):
   echo "HUGGINGFACE_API_KEY=hf_tu_token_aqui" > .env

4. Reiniciar:
   docker compose down
   docker compose up --build -d

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ALTERNATIVAS SI NO QUIERES CREAR CUENTA:

1. AssemblyAI (gratis con límites)
   • 5 horas gratis al mes
   • https://www.assemblyai.com/

2. Deepgram (gratis con límites)
   • $200 de crédito gratis
   • https://deepgram.com/

3. Google Cloud Speech-to-Text
   • 60 minutos gratis al mes
   • Requiere tarjeta de crédito

4. Azure Speech Services
   • 5 horas gratis al mes
   • Requiere tarjeta de crédito

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMENDACIÓN: Hugging Face es la opción más fácil y sin tarjeta.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    segments: null,
    raw: null
  };
}

module.exports = { transcribeFile };
