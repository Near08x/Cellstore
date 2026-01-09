# Makefile para Studio App
# Simplifica comandos comunes de Docker y desarrollo

.PHONY: help build up down restart logs status health shell clean rebuild dev install typecheck

# Color output
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
RESET  := $(shell tput -Txterm sgr0)

help: ## Mostrar esta ayuda
	@echo ''
	@echo 'Uso:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} { \
		if (/^[a-zA-Z_-]+:.*?##.*$$/) {printf "  ${YELLOW}%-15s${GREEN}%s${RESET}\n", $$1, $$2} \
		else if (/^## .*$$/) {printf "  ${WHITE}%s${RESET}\n", substr($$1,4)} \
		}' $(MAKEFILE_LIST)

## Desarrollo
dev: ## Ejecutar en modo desarrollo
	npm run dev

install: ## Instalar dependencias
	npm install

typecheck: ## Verificar tipos TypeScript
	npm run typecheck

## Docker
build: ## Construir imagen Docker
	@echo "${GREEN}Construyendo imagen Docker...${RESET}"
	docker-compose build

up: ## Iniciar contenedor
	@echo "${GREEN}Iniciando contenedor...${RESET}"
	docker-compose up -d
	@echo "${GREEN}✅ Aplicación disponible en http://localhost:9000${RESET}"

down: ## Detener contenedor
	@echo "${YELLOW}Deteniendo contenedor...${RESET}"
	docker-compose down

restart: ## Reiniciar contenedor
	@echo "${YELLOW}Reiniciando contenedor...${RESET}"
	docker-compose restart

logs: ## Ver logs en tiempo real
	docker-compose logs -f app

status: ## Ver estado de contenedores
	docker-compose ps

health: ## Verificar health check
	@echo "${GREEN}Verificando health check...${RESET}"
	@curl -f http://localhost:9000/api/health || echo "${YELLOW}Health check falló${RESET}"

shell: ## Abrir shell en el contenedor
	docker-compose exec app sh

clean: ## Limpiar contenedores, imágenes y volúmenes
	@echo "${YELLOW}Limpiando Docker...${RESET}"
	docker-compose down -v --rmi all
	@echo "${GREEN}✅ Limpieza completada${RESET}"

rebuild: ## Reconstruir completamente
	@echo "${GREEN}Reconstruyendo...${RESET}"
	docker-compose down
	docker-compose build
	docker-compose up -d
	@echo "${GREEN}✅ Reconstrucción completada${RESET}"

## Utilidades
create-admin: ## Crear usuario administrador
	npm run create-admin

register: ## Registrar nuevo usuario
	npm run register

.DEFAULT_GOAL := help
