#!/bin/bash
# Script para descargar el modelo de Vosk (español)

MODEL_DIR="./models"
MODEL_NAME="vosk-model-small-es-0.42"
MODEL_URL="https://alphacephei.com/vosk/models/${MODEL_NAME}.zip"
MODEL_ZIP="${MODEL_DIR}/${MODEL_NAME}.zip"

echo "🚀 Descargando modelo de transcripción gratuito (Vosk)..."
echo "📦 Tamaño aproximado: ~50 MB"
echo ""

# Crear directorio de modelos
mkdir -p "$MODEL_DIR"

# Descargar modelo
echo "⬇️  Descargando modelo..."
curl -L "$MODEL_URL" -o "$MODEL_ZIP"

if [ $? -eq 0 ]; then
    echo "✅ Descarga completada"
    echo "📂 Descomprimiendo modelo..."
    
    cd "$MODEL_DIR"
    unzip -q "$MODEL_NAME.zip"
    
    if [ $? -eq 0 ]; then
        echo "✅ Modelo instalado correctamente"
        echo "🗑️  Limpiando archivos temporales..."
        rm "$MODEL_NAME.zip"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ ¡Instalación completada!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "📝 Próximos pasos:"
        echo "   1. Reinicia la aplicación:"
        echo "      docker compose down && docker compose up --build -d"
        echo ""
        echo "   2. Sube un archivo de audio/video"
        echo ""
        echo "   3. ¡Disfruta de transcripción GRATUITA!"
        echo ""
    else
        echo "❌ Error al descomprimir el modelo"
        exit 1
    fi
else
    echo "❌ Error al descargar el modelo"
    echo "💡 Verifica tu conexión a internet"
    exit 1
fi
