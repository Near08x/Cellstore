#!/bin/bash

# Script helper para gestionar Docker
# Uso: ./docker.sh [comando]

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_env() {
    if [ ! -f .env.local ]; then
        print_error "Archivo .env.local no encontrado"
        print_info "Copia .env.example a .env.local y configura tus variables"
        exit 1
    fi
}

case "$1" in
    build)
        print_info "Construyendo imagen Docker..."
        check_env
        docker-compose build
        print_success "Imagen construida exitosamente"
        ;;
    
    up|start)
        print_info "Iniciando contenedor..."
        check_env
        docker-compose up -d
        print_success "Contenedor iniciado"
        print_info "Aplicación disponible en http://localhost:9000"
        ;;
    
    down|stop)
        print_info "Deteniendo contenedor..."
        docker-compose down
        print_success "Contenedor detenido"
        ;;
    
    restart)
        print_info "Reiniciando contenedor..."
        docker-compose restart
        print_success "Contenedor reiniciado"
        ;;
    
    logs)
        docker-compose logs -f app
        ;;
    
    status)
        docker-compose ps
        ;;
    
    health)
        print_info "Verificando health check..."
        curl -f http://localhost:9000/api/health || print_error "Health check falló"
        ;;
    
    shell|bash)
        print_info "Abriendo shell en el contenedor..."
        docker-compose exec app sh
        ;;
    
    clean)
        print_info "Limpiando contenedores, imágenes y volúmenes..."
        docker-compose down -v --rmi all
        print_success "Limpieza completada"
        ;;
    
    rebuild)
        print_info "Reconstruyendo y reiniciando..."
        check_env
        docker-compose down
        docker-compose build
        docker-compose up -d
        print_success "Reconstrucción completada"
        print_info "Aplicación disponible en http://localhost:9000"
        ;;
    
    *)
        echo "🐳 Script de gestión Docker para Studio"
        echo ""
        echo "Uso: ./docker.sh [comando]"
        echo ""
        echo "Comandos disponibles:"
        echo "  build       - Construir la imagen Docker"
        echo "  up|start    - Iniciar el contenedor"
        echo "  down|stop   - Detener el contenedor"
        echo "  restart     - Reiniciar el contenedor"
        echo "  logs        - Ver logs en tiempo real"
        echo "  status      - Ver estado de los contenedores"
        echo "  health      - Verificar health check"
        echo "  shell|bash  - Abrir shell en el contenedor"
        echo "  clean       - Limpiar todo (contenedores, imágenes, volúmenes)"
        echo "  rebuild     - Reconstruir completamente"
        echo ""
        echo "Ejemplo: ./docker.sh build"
        ;;
esac
