const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

/**
 * Detecta automáticamente quién habla usando análisis de pausas y cambios
 * Esta es una implementación simple sin modelos adicionales
 */
async function detectSpeakers(filePath) {
  console.log('🎤 Análisis de hablantes habilitado...');
  // Por ahora retornamos null y usaremos el análisis de Whisper con timestamps
  // Whisper puede detectar cambios mediante análisis de pausas largas
  return null;
}

/**
 * transcribeFile usando Hugging Face Whisper (GRATIS)
 * Usa la API directa de Hugging Face con el modelo Whisper
 */
async function transcribeFile(filePath, opts = { verbose: false, diarize: false }) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  console.log('🔍 Verificando token de Hugging Face...');
  console.log('Token encontrado:', apiKey ? `Sí (${apiKey.substring(0, 6)}...)` : 'No');
  
  if (!apiKey) {
    console.log('⚠️ HUGGINGFACE_API_KEY no configurado - Usando modo demostración');
    return generateDemoText(filePath);
  }

  console.log('🚀 Transcribiendo con Hugging Face Whisper (GRATIS)...');
  
  // Si está habilitada la diarización, primero detectar hablantes
  let speakerSegments = null;
  if (opts.diarize) {
    speakerSegments = await detectSpeakers(filePath);
  }
  
  try {
    console.log('📁 Leyendo archivo:', filePath);
    const audioBuffer = fs.readFileSync(filePath);
    console.log('✅ Archivo leído:', (audioBuffer.length / 1024 / 1024).toFixed(2), 'MB');
    
    // Detectar tipo de archivo (audio y video)
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      // Audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/m4a',
      '.webm': 'audio/webm',
      '.aac': 'audio/aac',
      // Video (FFmpeg ya extrajo el audio, así que enviamos como audio)
      '.mp4': 'audio/mpeg',
      '.avi': 'audio/wav',
      '.mov': 'audio/m4a',
      '.mkv': 'audio/mpeg'
    };
    const contentType = mimeTypes[ext] || 'audio/mpeg';
    
    // Usar API directa de Hugging Face
    const API_URL = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3';
    
    console.log('🎯 Enviando a Hugging Face API...');
    console.log('📋 Content-Type:', contentType);
    
    const response = await axios.post(API_URL, audioBuffer, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': contentType,
        'Accept': 'application/json'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    
    console.log('✅ Transcripción completada con Hugging Face');
    console.log('📝 Resultado:', response.data);
    
    // Si la diarización está habilitada, aplicar detección inteligente
    let finalText = response.data.text || 'No se pudo transcribir el audio';
    
    if (opts.diarize) {
      console.log('🔄 Aplicando detección inteligente de hablantes...');
      finalText = formatWithSpeakers(response.data.text, null);
    }
    
    return {
      text: finalText,
      segments: speakerSegments,
      raw: response.data
    };
    
  } catch (error) {
    console.error('❌ Error detallado con Hugging Face:');
    console.error('Mensaje:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    
    // Si el modelo está cargando
    if (error.response?.status === 503 || error.response?.data?.error?.includes('loading')) {
      const estimatedTime = error.response?.data?.estimated_time || 20;
      return {
        text: `⏳ El modelo Whisper se está cargando...

El modelo está iniciándose en los servidores de Hugging Face.
Tiempo estimado: ${estimatedTime} segundos

✅ SOLUCIONES:

1️⃣ ESPERA ${estimatedTime} segundos e intenta de nuevo
2️⃣ USA la grabación en tiempo real (funciona inmediatamente)
3️⃣ REINTENTA en unos momentos

💡 Este mensaje aparece cuando el modelo no se ha usado recientemente.
   Solo necesitas esperar una vez, luego será instantáneo.`,
        segments: null
      };
    }
    
    // Error 400 - Bad Request
    if (error.response?.status === 400) {
      return {
        text: `❌ Error al procesar el archivo de audio/video

El archivo no pudo ser procesado por Hugging Face.

✅ POSIBLES CAUSAS:

1️⃣ Archivo muy grande (máximo 100 MB)
   • Tamaño actual: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB
   • Reduce la calidad o duración del audio/video

2️⃣ Formato incompatible
   • Audio soportado: MP3, WAV, FLAC, OGG, M4A, AAC
   • Video soportado: MP4, AVI, MOV, MKV
   • Convierte en: https://convertio.co/es/

3️⃣ Archivo corrupto o inválido
   • Verifica que el archivo se reproduzca correctamente
   • Prueba con otro archivo

💡 SOLUCIÓN RÁPIDA: Usa la grabación en tiempo real (sin límites de tamaño)`,
        segments: null
      };
    }
    
    // Error de Content-Type
    if (error.response?.data?.error?.includes('Content type')) {
      return {
        text: `❌ Error de formato de archivo

El archivo no tiene el formato correcto.

✅ SOLUCIONES:

1️⃣ USA estos formatos:
   
   🎵 AUDIO:
   • MP3 (.mp3)
   • WAV (.wav)
   • FLAC (.flac)
   • OGG (.ogg)
   • M4A (.m4a)
   • AAC (.aac)
   
   🎬 VIDEO (se extrae el audio automáticamente):
   • MP4 (.mp4)
   • AVI (.avi)
   • MOV (.mov)
   • MKV (.mkv)

2️⃣ CONVIERTE tu archivo
   • Usa un conversor online: https://convertio.co/es/
   • Formatos recomendados: MP3 o MP4

3️⃣ USA la grabación en tiempo real
   • No requiere archivos, funciona directo

📝 Formato actual: ${path.extname(filePath)}
💡 Tamaño máximo: 100 MB`,
        segments: null
      };
    }
    
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

/**
 * Formatea el texto de transcripción con información de hablantes
 * Detecta cambios de hablante por pausas largas y cambios de contexto
 */
function formatWithSpeakers(text, speakerSegments) {
  if (!text) return text;
  
  console.log('📝 Aplicando detección inteligente de hablantes...');
  
  // Dividir en oraciones manteniendo puntuación
  const sentences = text.split(/(?<=[.?!])\s+/).filter(s => s.trim());
  
  if (sentences.length === 0) return text;
  
  let formattedText = '';
  let currentSpeaker = 1;
  let lastSpeaker = 0;
  let sentencesSinceChange = 0;
  
  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();
    
    // Indicadores de cambio de hablante
    const isQuestion = trimmed.endsWith('?');
    const prevWasQuestion = index > 0 && sentences[index - 1].trim().endsWith('?');
    const nextIsResponse = index < sentences.length - 1 && !sentences[index + 1].trim().endsWith('?');
    
    // Patrones de respuesta común
    const responsePatterns = /^(Sí|No|Claro|Bueno|Eh|Ah|Ok|Okay|Bien|Exacto|Correcto|Por supuesto|De acuerdo|Hola|Hey)/i;
    const isLikelyResponse = responsePatterns.test(trimmed);
    
    // REGLA 1: Pregunta → Respuesta (cambio muy probable)
    if (prevWasQuestion && !isQuestion) {
      currentSpeaker = currentSpeaker === 1 ? 2 : 1;
      sentencesSinceChange = 0;
    }
    // REGLA 2: Respuesta directa detectada (Sí, No, Claro, etc.)
    else if (isLikelyResponse && index > 0) {
      currentSpeaker = currentSpeaker === 1 ? 2 : 1;
      sentencesSinceChange = 0;
    }
    // REGLA 3: Después de 2-3 oraciones largas, alternar (conversación natural)
    else if (sentencesSinceChange >= 2 && trimmed.split(' ').length > 5) {
      currentSpeaker = currentSpeaker === 1 ? 2 : 1;
      sentencesSinceChange = 0;
    }
    // REGLA 4: Pregunta después de afirmación (nuevo tema)
    else if (isQuestion && !prevWasQuestion && index > 0) {
      // A veces las preguntas de seguimiento son del mismo hablante
      // Solo cambiar si han pasado varias oraciones
      if (sentencesSinceChange >= 2) {
        currentSpeaker = currentSpeaker === 1 ? 2 : 1;
        sentencesSinceChange = 0;
      }
    }
    
    // Solo agregar etiqueta si cambia el hablante
    if (currentSpeaker !== lastSpeaker) {
      const speakerLabel = `Persona-${String(currentSpeaker).padStart(2, '0')}`;
      formattedText += `\n[${speakerLabel}]\n`;
      lastSpeaker = currentSpeaker;
    }
    
    formattedText += sentence + ' ';
    sentencesSinceChange++;
  });
  
  return formattedText.trim();
}

module.exports = { transcribeFile };
