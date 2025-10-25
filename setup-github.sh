#!/bin/bash

echo "🚀 Inicializando repositorio de GitHub..."
echo ""

# Verificar si Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado. Descárgalo desde: https://git-scm.com/"
    exit 1
fi

# Inicializar repositorio Git
echo "📦 Inicializando repositorio local..."
git init

# Agregar todos los archivos
echo "➕ Agregando archivos..."
git add .

# Crear commit inicial
echo "💾 Creando commit inicial..."
git commit -m "Initial commit: Transcripción de audio con detección de hablantes"

echo ""
echo "✅ Repositorio local creado exitosamente!"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo ""
echo "1. Ve a GitHub y crea un nuevo repositorio:"
echo "   https://github.com/new"
echo ""
echo "2. Nombre sugerido: transcripcion-audio"
echo "   Descripción: Transcripción de audio con IA y detección de hablantes"
echo ""
echo "3. NO marques 'Initialize with README'"
echo ""
echo "4. Después de crear el repositorio, ejecuta:"
echo ""
echo "   git remote add origin https://github.com/TU_USUARIO/transcripcion-audio.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "💡 Reemplaza TU_USUARIO con tu nombre de usuario de GitHub"
echo ""
