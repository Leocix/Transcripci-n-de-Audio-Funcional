# 🔧 SOLUCIONES REALES PARA TRANSCRIPCIÓN

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### 1. BRAVE NO FUNCIONA CON GRABACIÓN EN TIEMPO REAL

**Por qué:** Brave bloquea Web Speech API por razones de privacidad.

**Soluciones:**
- ✅ Usa **Chrome** o **Edge** para grabación en tiempo real
- ✅ Usa **Hugging Face** para subir archivos (funciona en cualquier navegador)
- ✅ Usa otras alternativas listadas abajo

---

### 2. HUGGING FACE NO ESTÁ CONFIGURADO

**Síntomas:** Al subir archivo dice "TOKEN NO CONFIGURADO"

**Solución rápida (2 minutos):**

```powershell
# 1. Crea cuenta gratis (sin tarjeta): https://huggingface.co/join
# 2. Genera token: https://huggingface.co/settings/tokens
# 3. Configura:
echo "HUGGINGFACE_API_KEY=hf_tu_token_aqui" > .env

# 4. Reinicia:
docker compose down
docker compose up --build -d
```

---

## 🆓 ALTERNATIVAS GRATUITAS QUE SÍ FUNCIONAN

### ✅ 1. HUGGING FACE (Recomendado)

**Pros:**
- ✅ Completamente gratis
- ✅ No requiere tarjeta de crédito
- ✅ ~1000 archivos/día
- ✅ Alta precisión (Whisper)
- ✅ Ya integrado en esta app

**Contras:**
- ⚠️ Requiere crear cuenta (2 minutos)

**Cómo usar:**
1. https://huggingface.co/join → Crear cuenta
2. https://huggingface.co/settings/tokens → Generar token
3. Configurar .env con el token
4. Reiniciar app
5. ¡Listo!

---

### ✅ 2. ASSEMBLYAI (5 horas gratis/mes)

**Pros:**
- ✅ 5 horas de transcripción gratis cada mes
- ✅ Alta precisión
- ✅ API simple

**Contras:**
- ⚠️ Requiere tarjeta de crédito (no se cobra si no pasas el límite)
- ⚠️ Requiere modificar código

**Cómo implementar:**
```bash
npm install assemblyai

# En .env:
ASSEMBLYAI_API_KEY=tu_token
```

**Código (lib/transcribe.js):**
```javascript
const { AssemblyAI } = require('assemblyai');

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

const transcript = await client.transcripts.transcribe({
  audio_url: filePath
});

return { text: transcript.text };
```

**Más info:** https://www.assemblyai.com/

---

### ✅ 3. DEEPGRAM ($200 crédito gratis)

**Pros:**
- ✅ $200 de crédito gratis al registrarte
- ✅ Muy rápido
- ✅ Excelente precisión

**Contras:**
- ⚠️ Requiere tarjeta de crédito
- ⚠️ Crédito se acaba eventualmente

**Cómo usar:**
1. Registrarse en: https://deepgram.com/
2. Obtener API Key
3. Instalar SDK: `npm install @deepgram/sdk`

**Código:**
```javascript
const { createClient } = require('@deepgram/sdk');
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

const { result } = await deepgram.listen.prerecorded.transcribeFile(
  fs.readFileSync(filePath),
  { model: 'nova-2', language: 'es' }
);

return { text: result.results.channels[0].alternatives[0].transcript };
```

---

### ✅ 4. GOOGLE CLOUD SPEECH-TO-TEXT (60 min gratis/mes)

**Pros:**
- ✅ 60 minutos gratis cada mes
- ✅ Alta precisión
- ✅ Soporta muchos idiomas

**Contras:**
- ⚠️ Requiere tarjeta de crédito
- ⚠️ Configuración más compleja

**Cómo usar:**
1. https://cloud.google.com/speech-to-text
2. Crear proyecto en Google Cloud
3. Habilitar API
4. Descargar credenciales JSON

**Código:**
```javascript
const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient({
  keyFilename: 'credentials.json'
});

const audio = { content: fs.readFileSync(filePath).toString('base64') };
const config = {
  encoding: 'LINEAR16',
  sampleRateHertz: 16000,
  languageCode: 'es-ES',
};

const [response] = await client.recognize({ audio, config });
const transcription = response.results
  .map(result => result.alternatives[0].transcript)
  .join('\n');
```

---

### ✅ 5. AZURE SPEECH SERVICES (5 horas gratis/mes)

**Pros:**
- ✅ 5 horas gratis cada mes
- ✅ Buena precisión
- ✅ Español latino

**Contras:**
- ⚠️ Requiere cuenta Azure
- ⚠️ Requiere tarjeta de crédito

**Más info:** https://azure.microsoft.com/es-es/services/cognitive-services/speech-to-text/

---

### ✅ 6. WIT.AI (Completamente gratis, ilimitado)

**Pros:**
- ✅ Completamente gratis
- ✅ Sin límites
- ✅ De Meta/Facebook

**Contras:**
- ⚠️ Menor precisión que Whisper
- ⚠️ Solo funciona con audios cortos (<20 seg)

**Cómo usar:**
1. https://wit.ai/
2. Crear app
3. Obtener token

**Código:**
```javascript
const axios = require('axios');
const FormData = require('form-data');

const form = new FormData();
form.append('audio', fs.createReadStream(filePath));

const response = await axios.post(
  'https://api.wit.ai/speech',
  form,
  {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${process.env.WIT_AI_TOKEN}`,
      'Content-Type': 'audio/wav'
    }
  }
);

return { text: response.data.text };
```

---

## 🎯 RECOMENDACIÓN SEGÚN TU CASO

### Si usas Brave:
1. **Mejor:** Hugging Face (sube archivos)
2. **Alternativa:** AssemblyAI o Deepgram

### Si quieres máxima simplicidad:
1. **Mejor:** Hugging Face (solo crear cuenta, sin tarjeta)
2. **Alternativa:** Wit.ai (gratis ilimitado pero menor calidad)

### Si tienes tarjeta de crédito:
1. **Mejor:** Deepgram ($200 crédito gratis)
2. **Alternativa:** AssemblyAI (5h/mes gratis)
3. **Alternativa:** Google Cloud (60min/mes gratis)

### Si quieres mejor calidad:
1. **Mejor:** Hugging Face con Whisper
2. **Alternativa:** Deepgram
3. **Alternativa:** Google Cloud

---

## 🚀 IMPLEMENTACIÓN RÁPIDA: HUGGING FACE

**Pasos exactos:**

```powershell
# 1. Abrir navegador
start https://huggingface.co/join

# 2. Crear cuenta con email o Google

# 3. Ir a tokens
start https://huggingface.co/settings/tokens

# 4. Crear token:
# - Click "New token"
# - Nombre: "transcripcion"
# - Tipo: "read"
# - Copiar token (empieza con "hf_...")

# 5. Configurar (reemplaza hf_XXX con tu token):
cd C:\Users\Leona\OneDrive\Desktop\Transcripcion
echo "HUGGINGFACE_API_KEY=hf_tu_token_real_aqui" > .env

# 6. Reiniciar:
docker compose down
docker compose up --build -d

# 7. Abrir app:
start http://localhost:3000

# 8. Subir archivo y ¡listo!
```

---

## 📊 TABLA COMPARATIVA

| Servicio | Gratis | Sin Tarjeta | Límite | Precisión | Complejidad |
|----------|--------|-------------|--------|-----------|-------------|
| **Hugging Face** | ✅ | ✅ | ~1000/día | ⭐⭐⭐⭐⭐ | Fácil |
| **AssemblyAI** | 5h/mes | ❌ | 5h/mes | ⭐⭐⭐⭐⭐ | Fácil |
| **Deepgram** | $200 | ❌ | ~133h | ⭐⭐⭐⭐⭐ | Fácil |
| **Google Cloud** | 60min/mes | ❌ | 60min/mes | ⭐⭐⭐⭐ | Media |
| **Azure** | 5h/mes | ❌ | 5h/mes | ⭐⭐⭐⭐ | Media |
| **Wit.ai** | ✅ | ✅ | Ilimitado | ⭐⭐⭐ | Fácil |

---

## 🔥 MI RECOMENDACIÓN FINAL

**Para ti que usas Brave y quieres algo que funcione YA:**

### Opción 1: Hugging Face (la más fácil)
- 2 minutos de configuración
- No requiere tarjeta
- Ya está integrado en tu app
- Alta precisión

### Opción 2: AssemblyAI (si tienes tarjeta)
- 5 horas gratis al mes
- Muy buena calidad
- Requiere pequeño cambio en código

---

## 💻 SOPORTE

Si tienes problemas:
1. Verifica logs: `docker logs transcripcion-app-1`
2. Verifica .env: `cat .env` (debe tener HUGGINGFACE_API_KEY=hf_...)
3. Reinicia después de cambios: `docker compose restart`

---

## ✅ PRÓXIMOS PASOS

1. **Elige** una opción de arriba
2. **Sigue** los pasos de configuración
3. **Reinicia** la app
4. **Prueba** subiendo un archivo

¡Eso es todo! 🎉
