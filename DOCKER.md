# 🐳 Docker Setup - Studio App

## ✅ **ESTADO ACTUAL: VERIFICADO Y FUNCIONAL** (Enero 2026)

### Configuraciones Disponibles

| Archivo | Uso | Build Time | Optimización |
|---------|-----|-----------|--------------|
| `Dockerfile` | **Producción** | ~3-5 min | ⭐⭐⭐⭐⭐ Multi-stage, standalone |
| `Dockerfile.simple` | **Desarrollo rápido** | ~2-3 min | ⭐⭐⭐ Build directo |

### Cambios Recientes Aplicados

✅ Puerto 9000 configurado en todos los archivos  
✅ `npm start -p 9000` actualizado en package.json  
✅ Dependencias compiladas nativamente para Linux (evita problemas con node-thermal-printer)  
✅ Healthcheck optimizado (60s start period, 5 retries)  
✅ Compatible con Next.js 15 + `output: 'standalone'`  

---

## 📋 Requisitos Previos

- ✅ Docker Desktop instalado ([Descargar aquí](https://www.docker.com/products/docker-desktop))
- ✅ Docker Compose incluido con Docker Desktop
- ✅ 4GB RAM mínimo disponible para Docker

---

## 🚀 Inicio Rápido

### 1️⃣ Configurar Variables de Entorno

**Opción A: Usar archivo .env.local existente**
```bash
# Si ya tienes .env.local configurado, úsalo directamente
cp .env.local .env
```

**Opción B: Crear desde template**

**Opción B: Crear desde template**
```bash
cp .env.example .env
```

**Edita `.env` con tus credenciales de Supabase:**

```env
# REQUERIDO: Obtener desde https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Configuración local Docker (no cambiar)
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_SITE_URL=http://localhost:9000
```

### 2️⃣ Construir y Ejecutar con Docker Compose ⭐ **RECOMENDADO**

```bash
# Construir la imagen
docker-compose build

# Ejecutar en segundo plano
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f app
```

✅ **Aplicación disponible en:** http://localhost:9000  
🏥 **Healthcheck endpoint:** http://localhost:9000/api/health

### 3️⃣ Scripts npm Disponibles (Alternativa)

```bash
npm run docker:build      # Equivale a: docker-compose build
npm run docker:up         # Equivale a: docker-compose up -d
npm run docker:logs       # Equivale a: docker-compose logs -f app
npm run docker:down       # Equivale a: docker-compose down
npm run docker:restart    # Equivale a: docker-compose restart
npm run docker:clean      # Limpia TODO (imágenes, volúmenes, etc.)
```

### 4️⃣ Scripts PowerShell (Windows)

```powershell
# Construir
.\docker.ps1 build

# Iniciar
.\docker.ps1 start

# Ver logs
.\docker.ps1 logs

# Detener
.\docker.ps1 stop

# Reiniciar
.\docker.ps1 restart
```

---

## 🛠️ Comandos Útiles

### Gestión Básica

```bash
# Detener los contenedores
docker-compose down

# Reconstruir y reiniciar
docker-compose up -d --build

# Ver el estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ejecutar comandos dentro del contenedor
docker-compose exec app sh

# Limpiar todo (contenedores, imágenes, volúmenes)
docker-compose down -v --rmi all
```

## 🏗️ Construcción Manual (Sin Compose)

### Construir la imagen:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:9000 \
  --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:9000 \
  -t studio-app:latest .
```

### Ejecutar el contenedor:

```bash
docker run -d \
  --name studio-app \
  -p 9000:9000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key \
  -e NEXT_PUBLIC_API_URL=http://localhost:9000 \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:9000 \
  studio-app:latest
```

## 🏥 Health Check

El contenedor incluye un health check que verifica cada 30 segundos:

```bash
# Verificar el estado del contenedor
docker inspect --format='{{.State.Health.Status}}' studio-app
```

Endpoint de health check: `http://localhost:9000/api/health`

## 📦 Optimizaciones Incluidas

- **Multi-stage build**: Reduce el tamaño final de la imagen
- **Standalone output**: Next.js optimizado para producción
- **Layer caching**: Aprovecha la cache de Docker para builds más rápidos
- **Non-root user**: Ejecuta la aplicación con usuario no privilegiado
- **Health checks**: Monitoreo automático del estado del contenedor
- **Alpine Linux**: Imagen base ligera (~100MB final)

## 🔧 Troubleshooting

### El contenedor no inicia:

```bash
# Ver logs detallados
docker-compose logs app

# Verificar variables de entorno
docker-compose exec app env | grep NEXT_PUBLIC
```

### Error de conexión a Supabase:

- Verifica que las URLs y keys sean correctas en `.env.local`
- Asegúrate de que Supabase permita conexiones desde tu IP
- Revisa los logs: `docker-compose logs -f app`

### Puerto 9000 ocupado:

```bash
# Windows PowerShell
netstat -ano | findstr :9000

# Cambiar el puerto en docker-compose.yml
ports:
  - "8080:9000"  # Mapear puerto 8080 externo al 9000 interno
```

## 📊 Monitoreo

### Ver uso de recursos:

```bash
docker stats studio-app
```

### Ver procesos dentro del contenedor:

```bash
docker-compose exec app ps aux
```

## 🚀 Deployment a Producción

Para desplegar en producción, actualiza las variables de entorno:

```env
NEXT_PUBLIC_API_URL=https://tu-dominio.com
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
NODE_ENV=production
```

Y considera usar un orquestador como:
- Docker Swarm
- Kubernetes
- AWS ECS
- Google Cloud Run
- Azure Container Instances

## 📝 Notas Adicionales

- La imagen final pesa aproximadamente **150-200MB**
- El build inicial puede tomar **5-10 minutos**
- Los builds subsecuentes son más rápidos gracias al cache
- El contenedor usa **standalone mode** de Next.js para mejor rendimiento
