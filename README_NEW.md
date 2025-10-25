# 🎙️ Transcripción en Tiempo Real

Aplicación web para transcripción de audio/video en tiempo real usando OpenAI Whisper API.

## ✨ Características

- 🎤 **Grabación en tiempo real** desde el micrófono
- 📁 **Subida de archivos** de audio/video
- 📄 **Múltiples formatos de descarga**: TXT, PDF, SRT, VTT
- ⏱️ **Timestamps precisos** opcionales
- 📊 **Barra de progreso** durante la carga
- 📚 **Historial** de transcripciones
- 🎨 **Interfaz moderna y atractiva**

## 🚀 Inicio Rápido

### Requisitos Previos

- Docker Desktop instalado
- OpenAI API Key ([Obtener aquí](https://platform.openai.com/api-keys))

### Configuración

1. **Clonar o descargar el proyecto**

2. **Configurar la API Key de OpenAI**
   
   Crea un archivo `.env` en la raíz del proyecto:
   ```bash
   OPENAI_API_KEY=tu-api-key-aqui
   ```

3. **Iniciar la aplicación**
   
   ```bash
   docker compose up --build -d
   ```

4. **Abrir en el navegador**
   
   Visita: http://localhost:3000

## 📖 Uso

### Grabación en Tiempo Real
1. Click en "▶ Iniciar grabación"
2. Permite el acceso al micrófono
3. Habla normalmente
4. Click en "⏹ Detener" cuando termines

### Subir Archivo
1. Click en "Seleccionar archivo"
2. Elige un archivo de audio o video
3. (Opcional) Activa "Usar timestamps precisos"
4. Click en "📤 Subir y transcribir"
5. Espera a que se complete el proceso

### Descargar Transcripción
1. Selecciona el formato deseado (TXT, PDF, SRT, VTT)
2. Click en "💾 Descargar"

## 🛠️ Comandos Docker Útiles

```bash
# Detener la aplicación
docker compose down

# Ver logs
docker logs transcripcion-app-1

# Reconstruir después de cambios
docker compose up --build -d

# Ver contenedores activos
docker ps
```

## 🔧 Solución de Problemas

### Puerto 3000 ocupado
```powershell
# En Windows PowerShell:
netstat -ano | findstr :3000
Stop-Process -Id <PID> -Force
```

### Docker no responde
- Asegúrate de que Docker Desktop esté corriendo
- Reinicia Docker Desktop si es necesario

### Sin transcripción
- Verifica que tu `OPENAI_API_KEY` esté configurada correctamente en el archivo `.env`
- Revisa los logs: `docker logs transcripcion-app-1`
- Asegúrate de tener créditos en tu cuenta de OpenAI

## 📦 Tecnologías Utilizadas

- **Backend**: Node.js, Express, WebSocket
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Transcripción**: OpenAI Whisper API
- **Procesamiento**: FFmpeg
- **PDF**: PDFKit
- **Containerización**: Docker

## 📝 Formatos de Salida

- **TXT**: Texto plano sin formato
- **PDF**: Documento formateado con fecha y hora
- **SRT**: Subtítulos con timestamps (compatible con videos)
- **VTT**: Web Video Text Tracks (subtítulos web)

## 🌟 Mejoras Recientes

- ✅ Diseño moderno con gradientes y animaciones
- ✅ Barra de progreso durante la subida
- ✅ Soporte para generación de PDF
- ✅ Mensajes de estado informativos
- ✅ Historial interactivo de transcripciones
- ✅ Indicador visual de nombre de archivo seleccionado

## 📄 Licencia

MIT

---

**Desarrollado con ❤️ usando OpenAI Whisper**
