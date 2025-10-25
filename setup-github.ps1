# Script para subir el proyecto a GitHub

Write-Host "🚀 Inicializando repositorio de GitHub..." -ForegroundColor Cyan
Write-Host ""

# Verificar si Git está instalado
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git no está instalado. Descárgalo desde: https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Inicializar repositorio Git
Write-Host "📦 Inicializando repositorio local..." -ForegroundColor Yellow
git init

# Agregar todos los archivos
Write-Host "➕ Agregando archivos..." -ForegroundColor Yellow
git add .

# Crear commit inicial
Write-Host "💾 Creando commit inicial..." -ForegroundColor Yellow
git commit -m "Initial commit: Transcripción de audio con detección de hablantes"

Write-Host ""
Write-Host "✅ Repositorio local creado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ve a GitHub y crea un nuevo repositorio:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Nombre sugerido: transcripcion-audio" -ForegroundColor White
Write-Host "   Descripción: Transcripción de audio con IA y detección de hablantes" -ForegroundColor Gray
Write-Host ""
Write-Host "3. NO marques 'Initialize with README'" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Después de crear el repositorio, ejecuta:" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/TU_USUARIO/transcripcion-audio.git" -ForegroundColor Magenta
Write-Host "   git branch -M main" -ForegroundColor Magenta
Write-Host "   git push -u origin main" -ForegroundColor Magenta
Write-Host ""
Write-Host "💡 Reemplaza TU_USUARIO con tu nombre de usuario de GitHub" -ForegroundColor Yellow
Write-Host ""
