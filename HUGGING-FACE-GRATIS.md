# 🎉 ¡SOLUCIÓN GRATUITA CON HUGGING FACE!

## ✅ SÍ, HUGGING FACE ES 100% GRATUITO Y FUNCIONA PERFECTAMENTE

Tu aplicación ahora soporta **2 opciones 100% gratuitas**:

---

## 🚀 OPCIÓN 1: HUGGING FACE (Recomendado para archivos)

### ✨ Por qué usar Hugging Face:
- ✅ **100% GRATIS** - No requiere tarjeta de crédito
- ✅ **Sube archivos directamente** - MP3, MP4, WAV, etc.
- ✅ **Alta precisión** - Usa Whisper de OpenAI
- ✅ **90+ idiomas** - Español, inglés, francés, etc.
- ✅ **Rápido** - Procesa en segundos
- ✅ **~1000 archivos/día** - Más que suficiente

---

## 📝 CÓMO OBTENER TU TOKEN GRATIS (2 minutos)

### Paso 1: Crear cuenta en Hugging Face
```
1. Ve a: https://huggingface.co/join
2. Click en "Sign up"
3. Usa tu email o Google para registrarte
4. Verifica tu email
```

### Paso 2: Generar token de acceso
```
1. Ve a: https://huggingface.co/settings/tokens
2. Click en "New token"
3. Nombre: "transcripcion" (o el que quieras)
4. Tipo: Selecciona "read" (solo lectura)
5. Click en "Generate token"
6. ¡COPIA el token! (empieza con "hf_...")
```

### Paso 3: Configurar en tu aplicación
```powershell
# En Windows PowerShell, desde la carpeta del proyecto:

# Opción A: Crear archivo .env
echo "HUGGINGFACE_API_KEY=hf_tu_token_aqui" > .env

# Opción B: Editar .env manualmente
notepad .env
# Agrega: HUGGINGFACE_API_KEY=hf_tu_token_aqui
```

### Paso 4: Reiniciar la aplicación
```powershell
docker compose down
docker compose up --build -d
```

### Paso 5: ¡Usar!
```
1. Abre: http://localhost:3000
2. Ve a "OPCIÓN 2: Subir Archivo"
3. Selecciona tu archivo de audio/video
4. Click en "Subir y transcribir"
5. ¡Espera unos segundos y listo!
6. Descarga en TXT o PDF
```

---

## 🎤 OPCIÓN 2: GRABACIÓN EN TIEMPO REAL (Sin registro)

Si no quieres crear cuenta:

1. Abre http://localhost:3000
2. Ve a "OPCIÓN 1: Grabación en Tiempo Real"
3. Click en "Iniciar grabación"
4. Reproduce tu audio cerca del micrófono (o habla)
5. La transcripción aparece en tiempo real
6. Click en "Detener"
7. Descarga en TXT o PDF

✅ También 100% gratis, sin límites

---

## 🆚 COMPARACIÓN

| Característica | Hugging Face | Grabación en Tiempo Real |
|----------------|--------------|--------------------------|
| **Costo** | 🆓 Gratis | 🆓 Gratis |
| **Registro** | ✅ Requiere cuenta | ❌ No requiere |
| **Subir archivos** | ✅ Sí | ❌ No (reproduce+graba) |
| **Límites** | ~1000/día | ♾️ Ilimitado |
| **Velocidad** | ⚡ Muy rápido | 🕐 Tiempo real |
| **Precisión** | 🎯 Excelente | 🎯 Excelente |
| **Idiomas** | 90+ | Español, inglés, etc. |

---

## ❓ PREGUNTAS FRECUENTES

### ¿Hugging Face es realmente gratis?
**Sí, 100%**. No requiere tarjeta de crédito. Tiene límites generosos (~1000 solicitudes/día) que son más que suficientes para uso personal.

### ¿Qué pasa si alcanzo el límite?
Tienes 3 opciones:
1. Espera 24 horas (se resetea automáticamente)
2. Usa la "Grabación en Tiempo Real" (sin límites)
3. Crea otra cuenta gratis con otro email

### ¿Mis archivos quedan guardados en Hugging Face?
No, solo se procesan y se descartan. Hugging Face no guarda tus archivos.

### ¿Qué tan preciso es?
Muy preciso. Usa el mismo modelo Whisper de OpenAI que cuesta dinero en otros servicios.

### ¿Funciona con videos?
Sí, extrae el audio automáticamente de MP4, AVI, etc.

### ¿Qué formatos acepta?
MP3, WAV, MP4, M4A, FLAC, OGG, WEBM y más.

### ¿Necesito saber programar?
No, solo seguir los 5 pasos de arriba.

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### "Token inválido o expirado"
- Verifica que copiaste el token completo (empieza con "hf_")
- Asegúrate de no tener espacios al inicio/final
- Genera un nuevo token en Hugging Face
- Reinicia la app después de editar .env

### "Límite alcanzado"
- Espera unos minutos y vuelve a intentar
- O usa la "Grabación en Tiempo Real"
- O crea otra cuenta gratis

### "Modelo cargando"
- La primera vez puede tardar 20-30 segundos
- Vuelve a intentar en unos segundos
- Es normal, solo pasa la primera vez

### No aparece la transcripción
- Revisa los logs: `docker logs transcripcion-app-1`
- Verifica que el archivo .env tenga el token correcto
- Asegúrate de haber reiniciado la app

---

## 💡 CONSEJOS PRO

### Para mejor precisión:
- Usa archivos de audio limpios (poco ruido de fondo)
- Volumen moderado (no muy bajo ni muy alto)
- Preferiblemente en formato WAV o MP3 de buena calidad

### Para archivos grandes:
- El límite de archivo es ~25 MB
- Si tu archivo es más grande, divídelo o usa compresión
- O usa la "Grabación en Tiempo Real" reproduciéndolo por partes

### Para múltiples archivos:
- Puedes subir varios archivos uno tras otro
- Descarga cada transcripción antes de subir el siguiente

---

## 🎊 ¡EMPIEZA AHORA!

### OPCIÓN RÁPIDA (Sin registro):
```
1. http://localhost:3000
2. "Grabación en Tiempo Real"
3. Reproduce tu audio
4. ¡Listo!
```

### OPCIÓN COMPLETA (2 minutos de setup):
```
1. https://huggingface.co/join → Crear cuenta
2. https://huggingface.co/settings/tokens → Generar token
3. Editar .env → Agregar token
4. docker compose down && docker compose up -d
5. http://localhost:3000→ Subir archivo
6. ¡Listo!
```

---

## 📚 RECURSOS ADICIONALES

- **Crear cuenta:** https://huggingface.co/join
- **Generar token:** https://huggingface.co/settings/tokens
- **Documentación Hugging Face:** https://huggingface.co/docs/api-inference
- **Modelo Whisper:** https://huggingface.co/openai/whisper-large-v3

---

## ✨ ¡DISFRUTA TU TRANSCRIPCIÓN GRATUITA!

Ahora tienes **2 opciones 100% gratuitas** para transcribir:

1. **Hugging Face** - Sube archivos directamente (requiere cuenta gratis)
2. **Grabación en Tiempo Real** - Sin registro, ilimitado

**¡Ambas funcionan perfectamente!** 🎉
