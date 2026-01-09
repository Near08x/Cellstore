# Script helper para gestionar Docker en Windows
# Uso: .\docker.ps1 [comando]

param(
    [Parameter(Position=0)]
    [string]$Command
)

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Check-Env {
    if (-not (Test-Path .env.local)) {
        Print-Error "Archivo .env.local no encontrado"
        Print-Info "Copia .env.example a .env.local y configura tus variables"
        exit 1
    }
}

switch ($Command) {
    "build" {
        Print-Info "Construyendo imagen Docker..."
        Check-Env
        docker-compose build
        Print-Success "Imagen construida exitosamente"
    }
    
    { $_ -in "up", "start" } {
        Print-Info "Iniciando contenedor..."
        Check-Env
        docker-compose up -d
        Print-Success "Contenedor iniciado"
        Print-Info "Aplicación disponible en http://localhost:9000"
    }
    
    { $_ -in "down", "stop" } {
        Print-Info "Deteniendo contenedor..."
        docker-compose down
        Print-Success "Contenedor detenido"
    }
    
    "restart" {
        Print-Info "Reiniciando contenedor..."
        docker-compose restart
        Print-Success "Contenedor reiniciado"
    }
    
    "logs" {
        docker-compose logs -f app
    }
    
    "status" {
        docker-compose ps
    }
    
    "health" {
        Print-Info "Verificando health check..."
        try {
            $response = Invoke-WebRequest -Uri http://localhost:9000/api/health -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Print-Success "Health check OK"
                $response.Content
            }
        } catch {
            Print-Error "Health check falló: $_"
        }
    }
    
    { $_ -in "shell", "bash" } {
        Print-Info "Abriendo shell en el contenedor..."
        docker-compose exec app sh
    }
    
    "clean" {
        Print-Info "Limpiando contenedores, imágenes y volúmenes..."
        docker-compose down -v --rmi all
        Print-Success "Limpieza completada"
    }
    
    "rebuild" {
        Print-Info "Reconstruyendo y reiniciando..."
        Check-Env
        docker-compose down
        docker-compose build
        docker-compose up -d
        Print-Success "Reconstrucción completada"
        Print-Info "Aplicación disponible en http://localhost:9000"
    }
    
    default {
        Write-Host "🐳 Script de gestión Docker para Studio" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Uso: .\docker.ps1 [comando]"
        Write-Host ""
        Write-Host "Comandos disponibles:"
        Write-Host "  build       - Construir la imagen Docker"
        Write-Host "  up|start    - Iniciar el contenedor"
        Write-Host "  down|stop   - Detener el contenedor"
        Write-Host "  restart     - Reiniciar el contenedor"
        Write-Host "  logs        - Ver logs en tiempo real"
        Write-Host "  status      - Ver estado de los contenedores"
        Write-Host "  health      - Verificar health check"
        Write-Host "  shell|bash  - Abrir shell en el contenedor"
        Write-Host "  clean       - Limpiar todo (contenedores, imágenes, volúmenes)"
        Write-Host "  rebuild     - Reconstruir completamente"
        Write-Host ""
        Write-Host "Ejemplo: .\docker.ps1 build"
    }
}
