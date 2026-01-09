# 🚀 Guía de Inicio Rápido - Studio App

## 📦 Prerrequisitos

- **Node.js** 20+ ([Descargar](https://nodejs.org/))
- **Docker Desktop** ([Descargar](https://www.docker.com/products/docker-desktop))
- **Cuenta Supabase** ([Crear cuenta](https://supabase.com))

## 🎯 Opción 1: Desarrollo Local (Más Rápido)

### 1. Clonar e Instalar

```bash
git clone <repository-url>
cd studio-main
npm install
```

### 2. Configurar Environment

```bash
# Copiar template
cp .env.example .env.local

# Editar con tus credenciales de Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
# SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Ejecutar

```bash
npm run dev
```

✅ **App corriendo en: http://localhost:9000**

---

## 🐳 Opción 2: Docker (Recomendado para Producción)

### Método A: Scripts PowerShell (Windows)

```powershell
# Construir
.\docker.ps1 build

# Iniciar
.\docker.ps1 start

# Ver logs
.\docker.ps1 logs

# Detener
.\docker.ps1 stop
```

### Método B: npm scripts (Multi-plataforma)

```bash
npm run docker:build    # Construir imagen
npm run docker:up       # Iniciar contenedor
npm run docker:logs     # Ver logs
npm run docker:down     # Detener
```

### Método C: Makefile (Linux/Mac)

```bash
make build    # Construir
make up       # Iniciar
make logs     # Ver logs
make down     # Detener
```

### Método D: Docker Compose directo

```bash
docker-compose build
docker-compose up -d
docker-compose logs -f
docker-compose down
```

✅ **App corriendo en: http://localhost:9000**

---

## 🎨 Características Principales

| Módulo | Descripción |
|--------|-------------|
| 🛒 **POS** | Punto de venta completo con múltiples métodos de pago |
| 📦 **Inventario** | Gestión de productos, stock y proveedores |
| 💰 **Préstamos** | Sistema completo con cuotas, intereses y mora (4%) |
| 📊 **Finanzas** | Dashboard BI con métricas, gráficos y reportes PDF |
| 👥 **Clientes** | Gestión de clientes y historial de transacciones |
| 🧾 **Facturación** | Generación de recibos e impresión térmica |

---

## 📋 Comandos Útiles

### Desarrollo
```bash
npm run dev              # Servidor desarrollo (puerto 9000)
npm run build            # Build de producción
npm start                # Ejecutar build
npm run typecheck        # Verificar TypeScript
```

### Usuarios
```bash
npm run create-admin     # Crear usuario administrador
npm run register         # Registrar nuevo usuario
```

### Docker
```bash
npm run docker:build     # Construir imagen
npm run docker:up        # Iniciar
npm run docker:down      # Detener
npm run docker:logs      # Ver logs
npm run docker:restart   # Reiniciar
npm run docker:clean     # Limpiar todo
```

### Con PowerShell
```powershell
.\docker.ps1 build       # Construir
.\docker.ps1 start       # Iniciar
.\docker.ps1 stop        # Detener
.\docker.ps1 logs        # Ver logs
.\docker.ps1 health      # Health check
.\docker.ps1 shell       # Abrir shell
.\docker.ps1 clean       # Limpiar
.\docker.ps1 rebuild     # Reconstruir
```

---

## 🔧 Configuración Avanzada

### Variables de Entorno (.env.local)

```env
# Supabase (Requerido)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# URLs
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_SITE_URL=http://localhost:9000

# Ambiente
NODE_ENV=development
```

### Puertos

- **Desarrollo**: `9000`
- **Producción (Docker)**: `9000`

Para cambiar el puerto:
- **Dev**: Editar `package.json` → `"dev": "next dev --turbopack -p NUEVO_PUERTO"`
- **Docker**: Editar `docker-compose.yml` → `ports: ["NUEVO_PUERTO:9000"]`

---

## 🏥 Health Check

Verificar que la app esté funcionando:

```bash
# Método 1: curl
curl http://localhost:9000/api/health

# Método 2: PowerShell
Invoke-WebRequest -Uri http://localhost:9000/api/health

# Método 3: Navegador
# Abrir: http://localhost:9000/api/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T...",
  "service": "studio-app"
}
```

---

## 🐛 Troubleshooting

### Puerto ocupado

```powershell
# Ver qué usa el puerto 9000
netstat -ano | findstr :9000

# Matar proceso (PowerShell como Admin)
Stop-Process -Id <PID> -Force
```

### Error de Supabase

- ✅ Verificar URLs y keys en `.env.local`
- ✅ Verificar que Supabase permita tu IP
- ✅ Ver logs: `npm run docker:logs` o `docker-compose logs -f`

### Docker no construye

```bash
# Limpiar cache de Docker
docker system prune -a

# Reconstruir desde cero
npm run docker:clean
npm run docker:build
```

### TypeScript errors

```bash
# Verificar errores
npm run typecheck

# Limpiar y reinstalar
rm -rf node_modules .next
npm install
```

---

## 📊 Arquitectura

```
┌─────────────────────────────────────────┐
│         Next.js App (Port 9000)         │
│  ┌──────────────────────────────────┐   │
│  │  App Router (src/app/)           │   │
│  │  - /api         (Backend)        │   │
│  │  - /pos         (POS)            │   │
│  │  - /loans       (Préstamos)      │   │
│  │  - /finance     (BI Dashboard)   │   │
│  │  - /inventory   (Inventario)     │   │
│  └──────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
                  │ Supabase Client
                  ▼
┌─────────────────────────────────────────┐
│         Supabase PostgreSQL             │
│  - clients                              │
│  - products                             │
│  - sales                                │
│  - loans                                │
│  - loan_installments                    │
│  - loan_payments                        │
│  - capital                              │
└─────────────────────────────────────────┘
```

---

## 🚀 Deploy a Producción

### Docker (Recomendado)

```bash
# 1. Configurar .env.local con URLs de producción
# 2. Construir
docker-compose build

# 3. Deploy
docker-compose up -d
```

### Plataformas

- ✅ Docker Swarm
- ✅ Kubernetes
- ✅ AWS ECS
- ✅ Google Cloud Run
- ✅ Azure Container Instances
- ✅ Vercel (sin Docker)

---

## 📚 Documentación Adicional

- 📘 [README.md](./README.md) - Documentación completa
- 🐳 [DOCKER.md](./DOCKER.md) - Guía detallada de Docker
- 📖 [docs/blueprint.md](./docs/blueprint.md) - Arquitectura del proyecto

---

## 🆘 Soporte

### Logs y Debugging

```bash
# Ver logs de desarrollo
npm run dev

# Ver logs de Docker
docker-compose logs -f app

# Ver logs del sistema
docker-compose ps
docker stats studio-app
```

### Recursos

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Docker Docs**: https://docs.docker.com

---

## ✅ Checklist de Instalación

- [ ] Node.js 20+ instalado
- [ ] Docker Desktop instalado y corriendo
- [ ] Cuenta Supabase creada
- [ ] Repositorio clonado
- [ ] `npm install` ejecutado
- [ ] `.env.local` configurado con credenciales
- [ ] App corriendo en http://localhost:9000
- [ ] Health check respondiendo OK

---

**¡Listo para comenzar! 🎉**

Si tienes problemas, revisa la sección de Troubleshooting o consulta la documentación detallada en DOCKER.md
