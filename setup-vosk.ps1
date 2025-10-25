# Script PowerShell para descargar el modelo de Vosk (español)

$MODEL_DIR = ".\models"
$MODEL_NAME = "vosk-model-small-es-0.42"
$MODEL_URL = "https://alphacephei.com/vosk/models/$MODEL_NAME.zip"
$MODEL_ZIP = "$MODEL_DIR\$MODEL_NAME.zip"

Write-Host "🚀 Descargando modelo de transcripción gratuito (Vosk)..." -ForegroundColor Cyan
Write-Host "📦 Tamaño aproximado: ~50 MB" -ForegroundColor Yellow
Write-Host ""

# Crear directorio de modelos
if (-not (Test-Path $MODEL_DIR)) {
    New-Item -ItemType Directory -Path $MODEL_DIR | Out-Null
}

# Descargar modelo
Write-Host "⬇️  Descargando modelo..." -ForegroundColor Green
try {
    Invoke-WebRequest -Uri $MODEL_URL -OutFile $MODEL_ZIP -UseBasicParsing
    Write-Host "✅ Descarga completada" -ForegroundColor Green
    
    # Descomprimir
    Write-Host "📂 Descomprimiendo modelo..." -ForegroundColor Yellow
    Expand-Archive -Path $MODEL_ZIP -DestinationPath $MODEL_DIR -Force
    
    Write-Host "✅ Modelo instalado correctamente" -ForegroundColor Green
    Write-Host "🗑️  Limpiando archivos temporales..." -ForegroundColor Yellow
    Remove-Item $MODEL_ZIP
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "✅ ¡Instalación completada!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "   1. Reinicia la aplicación:" -ForegroundColor White
    Write-Host "      docker compose down" -ForegroundColor Gray
    Write-Host "      docker compose up --build -d" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Sube un archivo de audio/video" -ForegroundColor White
    Write-Host ""
    Write-Host "   3. ¡Disfruta de transcripción GRATUITA!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "💡 Verifica tu conexión a internet" -ForegroundColor Yellow
    exit 1
}
