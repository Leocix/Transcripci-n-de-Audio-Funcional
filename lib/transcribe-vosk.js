const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Transcribe usando Vosk (offline, gratis)
 * Usa el modelo pequeño de Vosk que se descarga automáticamente
 */
async function transcribeFileVosk(audioPath) {
  return new Promise(async (resolve, reject) => {
    try {
      // Intentar usar vosk si está instalado
      let vosk;
      try {
        vosk = require('vosk');
      } catch (err) {
        console.log('⚠️ Vosk no disponible, usando transcripción simulada');
        return resolve({
          text: generateDemoTranscription(audioPath),
          segments: null
        });
      }

      const MODEL_PATH = path.join(__dirname, '../models/vosk-model-small-es-0.42');
      
      // Verificar si el modelo existe
      if (!fs.existsSync(MODEL_PATH)) {
        console.log('⚠️ Modelo Vosk no encontrado, usando transcripción simulada');
        return resolve({
          text: generateDemoTranscription(audioPath),
          segments: null
        });
      }

      const model = new vosk.Model(MODEL_PATH);
      const rec = new vosk.Recognizer({ model: model, sampleRate: 16000 });
      
      const wfReader = require('wav').Reader;
      const wfReadable = fs.createReadStream(audioPath, { highWaterMark: 4096 });
      const reader = new wfReader();

      let fullText = '';

      reader.on('format', async ({ audioFormat, sampleRate, channels }) => {
        if (sampleRate !== 16000) {
          console.warn('Sample rate debe ser 16000');
        }
        
        reader.on('data', (data) => {
          if (rec.acceptWaveform(data)) {
            const result = rec.result();
            if (result.text) {
              fullText += result.text + ' ';
            }
          }
        });

        reader.on('end', () => {
          const finalResult = rec.finalResult();
          if (finalResult.text) {
            fullText += finalResult.text;
          }
          rec.free();
          model.free();
          
          resolve({
            text: fullText.trim() || 'No se pudo transcribir el audio',
            segments: null
          });
        });
      });

      wfReadable.pipe(reader);

    } catch (error) {
      console.error('Error en Vosk:', error);
      resolve({
        text: generateDemoTranscription(audioPath),
        segments: null
      });
    }
  });
}

function generateDemoTranscription(audioPath) {
  const fileName = path.basename(audioPath);
  return `🎙️ TRANSCRIPCIÓN GRATUITA - MODO DEMOSTRACIÓN

Archivo procesado: ${fileName}
Fecha: ${new Date().toLocaleString('es-ES')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 NOTA: Esta es una transcripción de demostración.

Para habilitar la transcripción REAL y GRATUITA:

1️⃣ OPCIÓN 1: Usar Reconocimiento de Voz del Navegador (RECOMENDADO)
   ✅ Totalmente GRATIS
   ✅ No requiere instalación
   ✅ Funciona en tiempo real
   
   Cómo usar:
   - Ve a la sección "Grabación en Tiempo Real"
   - Click en "Iniciar grabación"
   - Lee el texto del archivo mientras grabas
   - ¡Listo! Transcripción gratuita

2️⃣ OPCIÓN 2: Usar Vosk (Motor Offline)
   ✅ Totalmente GRATIS
   ✅ Funciona sin internet
   ✅ No requiere API Keys
   ❌ Requiere descargar modelo (~50MB)
   
   Instrucciones:
   - Ejecuta: npm run setup-vosk
   - Reinicia la aplicación
   - Sube tu archivo nuevamente

3️⃣ OPCIÓN 3: Usar OpenAI Whisper (De Pago)
   ❌ Requiere créditos ($$$)
   ✅ Mayor precisión
   ✅ Soporta muchos idiomas
   
   Instrucciones:
   - Compra créditos en OpenAI
   - Configura OPENAI_API_KEY en .env
   - Reinicia la aplicación

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMENDACIÓN: Usa la OPCIÓN 1 (Reconocimiento del navegador)
   Es la más fácil y completamente gratuita.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

module.exports = { transcribeFileVosk };
