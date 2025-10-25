# 🎙️ Transcripción de Audio a Texto con IA# Prototipo: Transcripción en tiempo real y por archivo/video



Aplicación web para transcribir audio y video a texto usando **Hugging Face** (gratis) o **Web Speech API** (navegador). Incluye detección automática de hablantes, descarga en múltiples formatos (TXT, PDF, SRT, VTT) y diseño moderno.Este proyecto es un prototipo minimalista que permite:



![License](https://img.shields.io/badge/license-MIT-blue.svg)- Enviar audio en tiempo real (chunks) desde el navegador al servidor vía WebSocket.

![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)- Subir archivos de audio o video, extraer audio con ffmpeg y transcribir con la API de OpenAI/Whisper.

![Docker](https://img.shields.io/badge/docker-ready-blue.svg)- Descargar la transcripción en TXT, SRT y VTT (SRT/VTT generados de forma aproximada).



## ✨ CaracterísticasRequisitos

- Node.js 18+ (recomendado)

- 🎤 **Grabación en tiempo real** con detección de hablantes (Persona-01, Persona-02...)- Variable de entorno OPENAI_API_KEY con tu clave de OpenAI

- 📁 **Sube archivos** de audio/video (MP3, WAV, MP4, etc.)

- 🤖 **IA gratuita** con Hugging Face Whisper (sin tarjeta de crédito)Instalación (PowerShell en Windows):

- 🌐 **Web Speech API** para Chrome/Edge (100% gratis, sin configuración)

- 📄 **Descarga en múltiples formatos**: TXT, PDF, SRT, VTT```powershell

- 🎨 **Diseño moderno** con gradientes y animacionescd "c:\Users\Leona\OneDrive\Desktop\Nueva carpeta"

- 🐳 **Docker** para despliegue fácilnpm install

- 🚀 **Listo para Digital Ocean**$env:OPENAI_API_KEY = "tu_api_key_aqui"  # o define en .env

npm start

## 🚀 Inicio Rápido```



### Opción 1: Docker (Recomendado)Ejecutar con Docker (sin instalar Node/npm localmente)



```bashOpción A — docker-compose (recomendado):

# 1. Clonar repositorio

git clone https://github.com/TU_USUARIO/transcripcion-audio.git```powershell

cd transcripcion-audio# Definir la variable de entorno temporalmente en la sesión

$env:OPENAI_API_KEY = "sk-...tu_api_key..."

# 2. Configurar token de Hugging Face (opcional)

echo "HUGGINGFACE_API_KEY=tu_token_aqui" > .env# Levantar con docker-compose

docker-compose up --build -d

# 3. Ejecutar con Docker

docker-compose up -d# Ver logs

docker-compose logs -f

# 4. Abrir navegador

http://localhost:3000# Parar

```docker-compose down

```

### Opción 2: Node.js Local

Opción B — docker build + docker run:

```bash

# 1. Clonar repositorio```powershell

git clone https://github.com/TU_USUARIO/transcripcion-audio.gitdocker build -t realtime-transcription .

cd transcripcion-audiodocker run -p 3000:3000 -e OPENAI_API_KEY="sk-...tu_api_key..." --rm realtime-transcription

```

# 2. Instalar dependencias

npm installNotas sobre Docker

- La imagen instala `ffmpeg` en runtime para evitar problemas de compatibilidad.

# 3. Configurar variables (opcional)- El volumen `./tmp` se monta para persistir archivos de transcripción temporales (puedes borrarlo manualmente).

cp .env.example .env- Asegúrate de exportar `OPENAI_API_KEY` antes de arrancar (o define un archivo `.env` y usa `docker compose --env-file` si prefieres).

# Editar .env con tu token

Uso

# 4. Ejecutar- Abre http://localhost:3000

node server.js- Usa "Iniciar grabación" para comenzar a enviar audio en tiempo real. El sistema manda chunks (cada 2s) al servidor y el servidor intenta transcribir cada chunk y devuelve texto parcial.

- Usa el selector de archivos para subir audio o video. Después de procesar recibirás la transcripción y botones para descargar TXT / SRT / VTT.

# 5. Abrir navegador

http://localhost:3000Notas y limitaciones

```- Este es un prototipo: la transcripción "en tiempo real" se realiza enviando chunks y transcribiendo cada chunk por separado. Esto produce latencia dependiente de la llamada a la API y podría generar cortes en la continuidad.

- La generación de SRT/VTT es aproximada (no usa timestamps de palabras) y sirve como punto de partida.

## 🔑 Obtener Token de Hugging Face (GRATIS)- Necesitarás una cuenta y clave de OpenAI y el modelo de audio (por ejemplo `whisper-1`) disponible en tu cuenta.



**Tiempo: 2 minutos | Costo: $0 | No requiere tarjeta**Mejoras sugeridas

- Implementar concatenación de chunks en el servidor y/o enviar streams para una transcripción más coherente.

1. Crea cuenta en: https://huggingface.co/join- Usar una librería que devuelva timestamps por palabra/frase y generar SRT precisos.

2. Ve a: https://huggingface.co/settings/tokens- Manejo avanzado de sesiones, autenticación y almacenamiento permanente de transcripciones.

3. Clic en "New token"
4. Nombre: `transcripcion` | Tipo: `Read`
5. Copiar token (empieza con `hf_`)
6. Agregar a `.env`:
   ```
   HUGGINGFACE_API_KEY=hf_tu_token_aqui
   ```

📖 **Guía detallada**: Ver `HUGGING-FACE-GRATIS.md`

## 🎯 Uso

### 1️⃣ Grabación en Tiempo Real (Chrome/Edge)

1. Clic en **"Iniciar Grabación"**
2. Permitir acceso al micrófono
3. Hablar normalmente
4. **Pausas de 3+ segundos** cambiarán el hablante automáticamente:
   - Primera persona → `[Persona-01]`
   - Segunda persona → `[Persona-02]`
   - Tercera persona → `[Persona-03]`
5. Clic en **"Detener"** cuando termines
6. Seleccionar formato (TXT/PDF) y descargar

### 2️⃣ Subir Archivo (Requiere Token)

1. Clic en **"Elegir archivo"**
2. Seleccionar audio/video (MP3, WAV, MP4, etc.)
3. Clic en **"Subir y transcribir"**
4. Esperar procesamiento (ver barra de progreso)
5. Descargar en formato deseado

### 📥 Formatos de Descarga

- **TXT**: Texto plano con etiquetas de hablantes
- **PDF**: Documento formateado con fecha y título
- **SRT**: Subtítulos con timestamps (archivos subidos)
- **VTT**: Subtítulos web (archivos subidos)

## 🧠 Detección de Hablantes

La app detecta automáticamente cambios de hablante usando:

- **Pausas largas** (3+ segundos de silencio)
- **Etiquetado secuencial**: Persona-01, Persona-02, etc.

Ejemplo de transcripción:
```
[Persona-01] Buenos días, vamos a comenzar la reunión.
[Persona-02] Perfecto, tengo la agenda lista.
[Persona-01] Excelente, empecemos con el primer punto.
```

## 🌐 Desplegar en Digital Ocean

### App Platform ($5/mes - Más fácil)

```bash
# 1. Subir a GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/transcripcion-audio.git
git push -u origin main

# 2. En Digital Ocean:
# - Ir a App Platform
# - Conectar repositorio de GitHub
# - Agregar variable: HUGGINGFACE_API_KEY
# - Deploy automático ✅
```

📖 **Guía completa**: Ver `DEPLOY.md`

## 🔧 Variables de Entorno

| Variable | Descripción | Requerido | Ejemplo |
|----------|-------------|-----------|---------|
| `HUGGINGFACE_API_KEY` | Token de Hugging Face | Sí (para archivos) | `hf_abc123...` |
| `PORT` | Puerto del servidor | No | `3000` |

## 🐛 Solución de Problemas

### ❌ "Brave no soporta Web Speech API"
- **Solución**: Usa Chrome, Edge o sube archivos

### ❌ "No se detectó ningún token"
- **Solución**: Agregar `HUGGINGFACE_API_KEY` a `.env`

### ❌ "Error al descargar PDF"
- **Solución**: Verificar que hay texto en el área de transcripción

### ❌ Puerto 3000 ocupado
- **Solución**: Cambiar `PORT=8080` en `.env`

## 📄 Licencia

MIT License

## 👨‍💻 Autor

Desarrollado con ❤️

---

**¿Preguntas?** Abre un [Issue](https://github.com/TU_USUARIO/transcripcion-audio/issues)

## 🟢 Realtime ASR (opcional, local) — Vosk

Si quieres usar transcripción en tiempo real sin servicios externos, puedes instalar Vosk y un modelo local. El servidor intentará usar Vosk si está disponible y el cliente puede iniciar una conexión realtime.

Instalación (Node):

```pwsh
# Instala binding de Vosk
npm install vosk

# Crea carpeta para modelos
mkdir models
cd models
# Descarga un modelo pequeño (ejemplo):
# https://alphacephei.com/vosk/models
# Descomprimir en ./models/vosk-model
```

Notas:
- Coloca el modelo en `./models/vosk-model` (ruta esperada por el servidor).
- En Windows es recomendable usar WSL si tienes problemas compilando dependencias.
- Si Vosk no está instalado o no encuentra el modelo, la funcionalidad realtime quedará deshabilitada y el servidor enviará un mensaje de error al cliente.

Uso en la app:
- Abre la página y pulsa **"🔴 Realtime ASR"** para enviar audio en tiempo real al servidor.
- El servidor devolverá mensajes `realtime-partial` y `realtime-final` vía WebSocket.

Si quieres que te ayude a descargar un modelo y probar localmente, dime y lo añadimos al Dockerfile o a las instrucciones de setup.
