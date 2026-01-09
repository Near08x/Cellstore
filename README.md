<div align="center">

# 🏪 Studio - Sistema de Gestión Empresarial

### Sistema integral de gestión para negocios modernos

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[Características](#-características-principales) •
[Instalación](#-instalación) •
[Documentación](#-documentación) •
[Tecnologías](#️-stack-tecnológico) •
[Contribuir](#-contribuir)

</div>

---

## 📖 Acerca del Proyecto

**Studio** es una plataforma completa de gestión empresarial desarrollada con tecnologías modernas y escalables. Diseñada para pequeñas y medianas empresas que necesitan un control integral de sus operaciones diarias: ventas, inventario, préstamos, finanzas y administración de clientes.

### ¿Por qué Studio?

✅ **Todo en uno**: POS, inventario, préstamos, finanzas y más en una sola plataforma  
✅ **Tiempo real**: Actualizaciones instantáneas de stock, ventas y pagos  
✅ **Multi-usuario**: Sistema de roles y permisos granulares  
✅ **Offline-first**: PWA que funciona sin conexión  
✅ **Reportes**: Exportación de datos y documentos en PDF  
✅ **Moderno**: Interfaz intuitiva y responsive

---

## ✨ Características Principales

### 🛒 Punto de Venta (POS)
- Interfaz de venta rápida e intuitiva
- Múltiples métodos de pago (efectivo, tarjeta, transferencia)
- Cálculo automático de impuestos y cambio
- Generación de facturas y recibos
- Impresión térmica de tickets
- Historial completo de transacciones

### 📦 Gestión de Inventario
- CRUD completo de productos
- Control de stock en tiempo real
- Múltiples niveles de precio por producto
- Sistema de alertas de stock bajo
- Gestión de proveedores
- Valoración de inventario

### 💰 Sistema de Préstamos
- Creación de préstamos con intereses configurables
- Planes de pago flexibles (diario, semanal, quincenal, mensual)
- Generación automática de cuotas
- Gestión de pagos parciales y totales
- Cálculo de mora y penalizaciones
- Seguimiento de pagos vencidos
- Recibos de pago imprimibles

### 📊 Dashboard de Finanzas
- Métricas en tiempo real
- Gráficos interactivos (ventas, préstamos, ingresos)
- Análisis de tendencias
- Reportes personalizables
- Exportación de datos

### 👥 Gestión de Clientes
- Perfil completo de clientes
- Historial de compras y préstamos
- Información de contacto
- Análisis de comportamiento de compra

### 🔐 Autenticación y Seguridad
- Sistema de roles (Admin, Cajero, Empleado)
- Permisos granulares por módulo
- Autenticación con Supabase
- Sesiones seguras

---

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase (gratuita)

### Desarrollo Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/studio.git
cd studio
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Opcional: AI/Genkit
GOOGLE_GENAI_API_KEY=tu_api_key
```

4. **Configurar Supabase**

- Crea un nuevo proyecto en [Supabase](https://supabase.com)
- Ejecuta las migraciones SQL (disponibles en la documentación)
- Configura las políticas de seguridad (RLS)

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en **http://localhost:9000**

### 🐳 Docker (Producción)

Para despliegue en producción con Docker:

```bash
# Windows
.\docker.ps1 build
.\docker.ps1 start

# Linux/Mac
chmod +x docker.sh
./docker.sh build
./docker.sh start
```

Ver [DOCKER.md](./DOCKER.md) para instrucciones detalladas.

---

## 🛠️ Stack Tecnológico

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React Framework con App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático
- **[Tailwind CSS](https://tailwindcss.com/)** - Estilos utility-first
- **[Shadcn/ui](https://ui.shadcn.com/)** - Componentes UI reutilizables
- **[Recharts](https://recharts.org/)** - Gráficos y visualizaciones
- **[React Hook Form](https://react-hook-form.com/)** - Manejo de formularios
- **[Zod](https://zod.dev/)** - Validación de esquemas

### Backend & Base de Datos
- **[Supabase](https://supabase.com/)** - Backend as a Service (PostgreSQL)
- **[Supabase Auth](https://supabase.com/auth)** - Autenticación
- **[Supabase Realtime](https://supabase.com/realtime)** - Actualizaciones en tiempo real

### Utilidades
- **[jsPDF](https://github.com/parallax/jsPDF)** - Generación de PDFs
- **[date-fns](https://date-fns.org/)** - Manejo de fechas
- **[React Hot Toast](https://react-hot-toast.com/)** - Notificaciones
- **[Lucide React](https://lucide.dev/)** - Iconos

### DevOps
- **[Docker](https://www.docker.com/)** - Containerización
- **[Vitest](https://vitest.dev/)** - Testing unitario
- **[ESLint](https://eslint.org/)** - Linting
- **[Prettier](https://prettier.io/)** - Formateo de código

---

## 📋 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (puerto 9000)
npm run build            # Build de producción
npm start                # Ejecutar build de producción

# Calidad de código
npm run typecheck        # Verificar tipos TypeScript
npm run lint             # Ejecutar ESLint
npm run analyze          # Analizar tamaño de bundles

# Testing
npm test                 # Ejecutar tests
npm run test:ui          # Tests con interfaz interactiva
npm run test:coverage    # Coverage de tests
npm run test:watch       # Tests en modo watch

# Utilidades
npm run create-admin     # Crear usuario administrador
npm run register         # Registrar nuevo usuario
npm run genkit:dev       # Desarrollo con AI/Genkit
npm run genkit:watch     # Genkit en modo watch

# Docker
npm run docker:build     # Construir imagen Docker
npm run docker:up        # Iniciar contenedores
npm run docker:down      # Detener contenedores
npm run docker:logs      # Ver logs
npm run docker:clean     # Limpiar todo (⚠️ elimina datos)
```

---

## 🧪 Testing

El proyecto incluye tests unitarios para módulos críticos usando Vitest:

```bash
# Ejecutar todos los tests
npm test

# Con interfaz interactiva
npm run test:ui

# Ver cobertura de código
npm run test:coverage
```

### Cobertura Actual
- **Módulo de Préstamos**: 100% en funciones críticas
- **Calculadora de Préstamos**: 100%
- **API de Préstamos**: Completa
- **Total**: 57 tests pasando ✅

---

## 📁 Estructura del Proyecto

```
studio-main/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── clients/       # Gestión de clientes
│   │   │   ├── loans/         # Sistema de préstamos
│   │   │   ├── products/      # Inventario
│   │   │   └── sales/         # Punto de venta
│   │   ├── clients/           # Página de clientes
│   │   ├── finance/           # Dashboard financiero
│   │   ├── inventory/         # Gestión de inventario
│   │   ├── loans/             # Gestión de préstamos
│   │   ├── pos/               # Punto de venta
│   │   └── settings/          # Configuración
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes base (shadcn)
│   │   ├── clients/           # Componentes de clientes
│   │   ├── loans/             # Componentes de préstamos
│   │   ├── pos/               # Componentes de POS
│   │   └── finance/           # Componentes de finanzas
│   ├── lib/                   # Utilidades y helpers
│   │   ├── supabaseClient.ts  # Cliente de Supabase
│   │   ├── supabaseServer.ts  # Servidor de Supabase
│   │   ├── types.ts           # Tipos TypeScript
│   │   └── utils.ts           # Funciones auxiliares
│   ├── modules/               # Lógica de negocio
│   │   ├── loans/             # Módulo de préstamos
│   │   ├── clients/           # Módulo de clientes
│   │   └── sales/             # Módulo de ventas
│   ├── schemas/               # Esquemas de validación Zod
│   └── hooks/                 # React hooks personalizados
├── public/                    # Archivos estáticos
├── scripts/                   # Scripts de utilidad
├── docs/                      # Documentación
└── workflows/                 # Flujos de trabajo
```

---

## 🏗️ Arquitectura

### Arquitectura en Capas

```
┌─────────────────────────────────────────┐
│          UI LAYER (React)               │
│  Components + Hooks + Client State      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       API LAYER (Next.js Routes)        │
│    Validación (Zod) + Auth + CORS       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      SERVICE LAYER (Business Logic)     │
│   Orquestación + Lógica de Negocio      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    REPOSITORY LAYER (Data Access)       │
│   Queries + Mapeo de Datos (Supabase)   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       DATABASE (Supabase/PostgreSQL)    │
└─────────────────────────────────────────┘
```

### Módulo de Préstamos (Ejemplo de Arquitectura)

```
src/modules/loans/
├── loans.calculator.ts     # Funciones puras de cálculo
│   ├── calculateInstallments()
│   ├── distributePayment()
│   ├── computeLoanAggregates()
│   └── isOverdue(), isPaid()
│
├── loans.repository.ts     # Acceso a datos
│   ├── getAllLoans()
│   ├── getLoanById()
│   ├── createLoan()
│   ├── updateLoan()
│   └── deleteLoan()
│
└── loans.service.ts        # Orquestación de negocio
    ├── createLoan()        → calculator + repository
    ├── processPayment()    → calculator + repository
    └── updateOverdueInstallments()
```

### Flujo de Datos (Préstamos)

```
1. Cliente solicita préstamo
   ↓
2. Route Handler (/api/loans)
   - Valida input con Zod schema
   - Extrae datos del request
   ↓
3. Loans Service
   - Calcula cuotas (calculator)
   - Genera número de préstamo
   - Orquesta creación
   ↓
4. Loans Repository
   - Inserta préstamo en Supabase
   - Inserta cuotas en batch
   - Mapea datos DB → App
   ↓
5. Retorna préstamo creado
   - Service recalcula agregados
   - Repository mapea tipos
   - API retorna JSON
```

### Validación con Zod

Todos los inputs de API se validan con schemas Zod:

```typescript
// src/schemas/loan.schema.ts
export const createLoanSchema = z.object({
  client_id: z.string().uuid(),
  principal: z.number().positive(),
  interestRate: z.number().nonnegative().max(100),
  // ...
});

// src/app/api/loans/route.ts
const input = createLoanSchema.parse(await request.json());
const loan = await loansService.createLoan(input);
```

### Patrones de Diseño Implementados

- **Repository Pattern**: Abstracción de acceso a datos
- **Service Layer**: Lógica de negocio separada
- **Factory Pattern**: Creación de objetos complejos (préstamos, cuotas)
- **Strategy Pattern**: Cálculos de intereses y planes de pago

---

## 🗄️ Base de Datos

### Schema de Supabase (PostgreSQL)

**Tablas Principales:**
- `clients` - Información de clientes
- `products` - Catálogo de productos
- `sales` - Registro de ventas
- `loans` - Préstamos otorgados
- `loan_installments` - Cuotas de préstamos
- `loan_payments` - Historial de pagos
- `capital` - Control de capital disponible
- `users` - Usuarios del sistema

### Configuración Inicial

1. Crear proyecto en [Supabase](https://supabase.com)
2. Obtener credenciales (URL y ANON_KEY)
3. Ejecutar migraciones SQL
4. Configurar Row Level Security (RLS)
5. Actualizar variables de entorno

---

## 🔐 Seguridad y Autenticación

### Sistema de Roles

| Rol | Permisos |
|-----|----------|
| **Admin** | Acceso total, gestión de usuarios, configuración |
| **Cajero** | POS, ventas, clientes, préstamos |
| **Empleado** | Consulta de inventario y reportes |

### Autenticación
- Supabase Auth con JWT
- Row Level Security (RLS) en todas las tablas
- Sesiones persistentes
- Refresh tokens automáticos

---

## 📊 Reportes y Analytics

### Dashboard de Finanzas
- **Análisis de Préstamos**: Márgenes, mora, pagos pendientes
- **Análisis de Ventas**: Por producto, método de pago, período
- **Calendario de Pagos**: Vencimientos de hoy, semana y mes
- **Gráficos Interactivos**: Recharts con datos en tiempo real

### Exportación de Datos
- **PDFs**: Facturas, recibos, reportes financieros
- **Impresión Térmica**: Tickets de venta
- **Formatos**: JSON, CSV (en desarrollo)

---

## 🚀 Roadmap

### ✅ Completado
- [x] Sistema de autenticación y roles
- [x] CRUD completo de clientes, productos y ventas
- [x] Sistema de préstamos con cuotas e intereses
- [x] Dashboard de finanzas con gráficos
- [x] Exportación de PDFs
- [x] Tests unitarios (módulo de préstamos)
- [x] Optimización de performance
- [x] Docker y despliegue

### 🚧 En Progreso
- [ ] Integración con impresoras térmicas
- [ ] Reportes avanzados y analytics
- [ ] Sistema de notificaciones push
- [ ] Backup automático de datos

### 📋 Planificado
- [ ] App móvil (React Native)
- [ ] API pública con documentación OpenAPI
- [ ] Integración con pasarelas de pago
- [ ] Multi-tenant (múltiples negocios)
- [ ] Dashboard personalizable con widgets
- [ ] Facturación electrónica

---

## 🚢 Despliegue a Producción

### Opción 1: Docker (Recomendado)

```bash
# 1. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de producción

# 2. Construir imagen
docker-compose build

# 3. Desplegar
docker-compose up -d

# 4. Verificar logs
docker-compose logs -f app
```

### Opción 2: Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Desplegar
vercel --prod

# 3. Configurar variables de entorno en Vercel Dashboard
```

### Plataformas Soportadas
- ✅ Docker Swarm
- ✅ Kubernetes
- ✅ Vercel
- ✅ AWS ECS
- ✅ Google Cloud Run
- ✅ Azure Container Instances

---

## ⚙️ Configuración Avanzada

### Variables de Entorno

```env
# Supabase (Requerido)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# AI/Genkit (Opcional)
GOOGLE_GENAI_API_KEY=AIzaSyxxx...

# Configuración (Opcional)
NEXT_PUBLIC_APP_NAME=Studio
NEXT_PUBLIC_DEFAULT_TAX_RATE=0.18
```

### Puerto de Desarrollo

Por defecto: **9000**

Para cambiar, edita `package.json`:
```json
"dev": "next dev --turbopack -p 3000"
```

### PWA y Service Worker
- Configurado con `next-pwa`
- Funciona offline
- Archivos generados en `/public`
- Cache de assets estáticos

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

1. **Fork** el proyecto
2. Crea una **rama feature** (`git checkout -b feature/NuevaCaracteristica`)
3. **Commit** tus cambios (`git commit -m 'Agregar NuevaCaracteristica'`)
4. **Push** a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un **Pull Request**

### Guías de Contribución
- Seguir convenciones de TypeScript y ESLint
- Escribir tests para nuevas funcionalidades
- Actualizar documentación cuando sea necesario
- Mantener la cobertura de tests > 80%

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para más detalles.

---

## 📚 Documentación

- [FEATURES.md](./FEATURES.md) - Lista completa de características
- [DOCKER.md](./DOCKER.md) - Guía de Docker y despliegue
- [QUICKSTART.md](./QUICKSTART.md) - Inicio rápido
- [docs/blueprint.md](./docs/blueprint.md) - Arquitectura del sistema
- [docs/FASE5_OPTIMIZATION.md](./docs/FASE5_OPTIMIZATION.md) - Optimizaciones aplicadas

---

## 🐛 Solución de Problemas

### La aplicación no inicia
```bash
# Limpiar caché y reinstalar
rm -rf node_modules .next
npm install
npm run dev
```

### Errores de Supabase
- Verificar que las variables de entorno estén correctas
- Comprobar que el proyecto de Supabase esté activo
- Revisar las políticas RLS en Supabase Dashboard

### Errores de Docker
```bash
# Ver logs
docker-compose logs -f

# Reiniciar contenedores
docker-compose restart

# Reconstruir desde cero
docker-compose down -v
docker-compose up --build
```

---

## 📄 Licencia

Este proyecto es de código propietario. Todos los derechos reservados.

---

## 👥 Autores

Desarrollado con ❤️ para la gestión empresarial moderna.

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - El framework React de producción
- [Supabase](https://supabase.com/) - Backend as a Service
- [Shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Vercel](https://vercel.com/) - Plataforma de hosting

---

<div align="center">

**¿Te gustó este proyecto? ¡Dale una ⭐ en GitHub!**

[Reportar Bug](https://github.com/tu-usuario/studio/issues) • [Solicitar Feature](https://github.com/tu-usuario/studio/issues) • [Documentación](./docs/)

</div>

