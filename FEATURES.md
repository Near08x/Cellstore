# 🏪 Studio - Características Completas del Sistema

## 📖 Descripción General

**Studio** es un sistema integral de gestión empresarial desarrollado con Next.js 15, TypeScript y Supabase. Diseñado para negocios que necesitan un control completo de ventas, inventario, préstamos y finanzas, todo en una sola plataforma moderna y eficiente.

---

## ✨ Características Principales

### 🛒 Sistema de Punto de Venta (POS)

- **Interfaz de Venta Rápida**
  - Búsqueda y selección de productos en tiempo real
  - Carrito de compras con múltiples productos
  - Cálculo automático de subtotales, impuestos (18%) y totales
  - Gestión de cantidades y precios unitarios

- **Métodos de Pago Flexibles**
  - Efectivo con cálculo automático de cambio
  - Tarjeta de crédito/débito
  - Transferencia bancaria
  - Múltiples métodos de pago en una sola transacción

- **Gestión de Ventas**
  - Registro completo de ventas con detalles de productos
  - Historial de ventas por fecha
  - Información del cliente en cada venta
  - Exportación de reportes de ventas

- **Facturación**
  - Generación automática de facturas
  - Recibos con detalles completos de la transacción
  - Impresión térmica de recibos
  - Exportación a PDF

---

### 📦 Gestión de Inventario

- **Catálogo de Productos**
  - Gestión completa de productos con CRUD
  - Múltiples niveles de precio (precio1, precio2, precio3)
  - Control de costo y precio de venta
  - Descripción detallada de productos

- **Control de Stock**
  - Seguimiento en tiempo real del inventario
  - Actualización automática al realizar ventas
  - Sistema de alertas de stock bajo
  - Umbral configurable para reposición

- **Proveedores**
  - Registro de proveedores por producto
  - Gestión de información de contacto

- **Consultas e Informes**
  - Consulta rápida de niveles de inventario
  - Listado de productos con bajo stock
  - Valoración de inventario (costo vs. precio venta)
  - Productos más vendidos

---

### 💰 Sistema de Préstamos

- **Gestión Completa de Préstamos**
  - Creación de préstamos con términos flexibles
  - Cálculo automático de intereses
  - Generación automática de cuotas
  - Número de préstamo único y secuencial

- **Planes de Pago Personalizados**
  - Préstamos mensuales
  - Préstamos quincenales
  - Préstamos semanales
  - Préstamos diarios
  - Términos configurables (3, 6, 12, 24 meses, etc.)

- **Gestión de Cuotas**
  - Estados de cuotas: Pendiente, Pagado, Parcial, Atrasado
  - Registro de pagos parciales
  - Fechas de vencimiento automáticas
  - Cálculo de principal e interés por cuota

- **Mora y Penalizaciones**
  - Cálculo automático de mora (4% por defecto)
  - Mora acumulativa sobre cuotas vencidas
  - Alertas de pagos atrasados
  - Gestión de cuotas vencidas

- **Seguimiento Financiero**
  - Monto total del préstamo
  - Monto total a pagar (capital + intereses)
  - Saldo pendiente en tiempo real
  - Historial completo de pagos
  - Monto vencido total

- **Documentación**
  - Recibos de pago imprimibles
  - Comprobantes de pago con detalles completos
  - Estado de cuenta del préstamo
  - Calendario de pagos

---

### 👥 Gestión de Clientes

- **Base de Datos de Clientes**
  - Registro completo de clientes (nombre, email, teléfono)
  - UUID único para cada cliente
  - Búsqueda y filtrado de clientes
  - Formularios de creación y edición

- **Historial del Cliente**
  - Relación 1:N con préstamos
  - Historial de transacciones
  - Préstamos activos y completados
  - Estado de cuenta consolidado

- **Gestión de Relaciones**
  - Vinculación de clientes con préstamos
  - Información de contacto actualizable
  - Segmentación de clientes

---

### 📊 Dashboard de Finanzas y Business Intelligence

- **Métricas en Tiempo Real**
  - Total de ventas del día/mes/año
  - Ingresos por préstamos
  - Capital disponible
  - Ganancias netas
  - ROI (Return on Investment)

- **Análisis de Préstamos**
  - Total de préstamos activos
  - Monto total prestado
  - Monto total por cobrar
  - Mora acumulada
  - Tasa de recuperación
  - Préstamos por estado

- **Gráficos Interactivos (Recharts)**
  - Gráficos de ventas por período
  - Tendencias de préstamos
  - Distribución de pagos
  - Análisis de mora
  - Comparativas mensuales/anuales

- **Reportes Exportables**
  - Exportación a PDF de reportes financieros
  - Reportes personalizados por fecha
  - Resúmenes ejecutivos
  - Análisis de rentabilidad

- **Análisis de Capital**
  - Seguimiento de capital inicial
  - Capital en circulación (préstamos activos)
  - Capital recuperado
  - Flujo de caja

---

### 🔐 Sistema de Autenticación y Roles

- **Autenticación Segura**
  - Login con email y contraseña
  - Sesiones persistentes con Supabase
  - Hash de contraseñas con bcrypt
  - Middleware de protección de rutas

- **Sistema de Roles**
  - **Admin**: Acceso completo a todas las funciones
  - **Cashier**: Acceso a POS, ventas y clientes
  - **Employee**: Acceso limitado a consultas
  - **User**: Acceso básico de lectura

- **Gestión de Usuarios**
  - Creación de usuarios administrativos
  - Registro de nuevos usuarios
  - Asignación de roles
  - Scripts de utilidad (`create-admin`, `register`)

---

### 🖨️ Sistema de Impresión

- **Impresión Térmica**
  - Soporte para impresoras térmicas (node-thermal-printer)
  - Configuración de impresoras por defecto
  - Formato optimizado para tickets de 58mm y 80mm

- **Impresión PDF**
  - Generación de documentos con jsPDF
  - Facturas en PDF
  - Recibos de pago
  - Reportes financieros

- **Impresión Web**
  - Componentes imprimibles con react-to-print
  - Vista previa antes de imprimir
  - Componentes optimizados para impresión
  - Renderizado off-screen para mejor calidad

---

### 📱 Progressive Web App (PWA)

- **Capacidades Offline**
  - Service Worker para caché
  - Funcionamiento sin conexión
  - Sincronización en segundo plano

- **Instalable**
  - Instalable en dispositivos móviles
  - Icono de aplicación personalizado
  - Manifest.json configurado

- **Optimización Móvil**
  - Diseño responsive
  - Touch-friendly
  - Rendimiento optimizado

---

## 🛠️ Stack Tecnológico Completo

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **Lenguaje**: TypeScript
- **UI Framework**: React 18.3.1
- **Estilos**: Tailwind CSS 3.4.1
- **Componentes UI**: Shadcn/ui + Radix UI
- **Formularios**: React Hook Form 7.54.2 + Zod 3.24.2
- **Notificaciones**: React Hot Toast 2.6.0

### Backend y Base de Datos
- **BaaS**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth Helpers
- **ORM**: Supabase Client JS 2.58.0
- **Hashing**: bcryptjs 2.4.3

### Gráficos y Visualización
- **Librería**: Recharts 2.15.1
- **Exportación PDF**: jsPDF 3.0.3
- **Captura HTML**: html2canvas 1.4.1

### Utilidades
- **Fechas**: date-fns 3.6.0
- **Impresión**: react-to-print 3.1.1
- **Impresoras térmicas**: node-thermal-printer 4.4.0
- **Carruseles**: embla-carousel-react 8.6.0
- **Iconos**: Lucide React 0.475.0

### IA y Genkit
- **AI Framework**: Genkit 1.14.1
- **Google AI**: @genkit-ai/googleai 1.14.1
- **Next.js Integration**: @genkit-ai/next 1.14.1

### Testing
- **Framework**: Vitest 4.0.16
- **Testing Library**: React Testing Library 16.3.1
- **Coverage**: @vitest/coverage-v8 4.0.16
- **UI**: @vitest/ui 4.0.16
- **DOM**: jsdom 27.4.0

### DevOps y Build
- **Containerización**: Docker + Docker Compose
- **Build Tool**: Turbopack (Next.js)
- **Análisis de Bundle**: @next/bundle-analyzer
- **Scripts Cross-platform**: cross-env 10.1.0

---

## 📋 Scripts y Comandos Disponibles

### Desarrollo
```bash
npm run dev              # Servidor de desarrollo (puerto 9000, con Turbopack)
npm run typecheck        # Verificar tipos TypeScript
npm run lint             # Linter ESLint
```

### Testing
```bash
npm test                 # Ejecutar tests
npm run test:ui          # Tests con interfaz interactiva
npm run test:run         # Ejecutar tests una vez
npm run test:coverage    # Generar reporte de cobertura
npm run test:watch       # Tests en modo watch
```

### Build y Producción
```bash
npm run build            # Build de producción
npm start                # Iniciar build de producción
npm run analyze          # Analizar tamaño de bundles
```

### Docker
```bash
npm run docker:build     # Construir imagen Docker
npm run docker:up        # Iniciar contenedores
npm run docker:down      # Detener contenedores
npm run docker:logs      # Ver logs
npm run docker:restart   # Reiniciar contenedores
npm run docker:clean     # Limpiar todo (volúmenes e imágenes)
```

### Utilidades
```bash
npm run create-admin     # Crear usuario administrador
npm run register         # Registrar nuevo usuario
```

### AI/Genkit
```bash
npm run genkit:dev       # Desarrollo con Genkit
npm run genkit:watch     # Genkit en modo watch
```

---

## 🗄️ Estructura de Base de Datos (Supabase)

### Tablas Principales

#### `products`
- `id` (uuid): Identificador único
- `name` (text): Nombre del producto
- `description` (text): Descripción
- `price` (numeric): Precio principal
- `price2` (numeric): Precio alternativo 2
- `price3` (numeric): Precio alternativo 3
- `cost` (numeric): Costo del producto
- `provider` (text): Proveedor
- `stock` (integer): Stock disponible

#### `sales`
- `id` (uuid): Identificador único
- `customer_name` (text): Nombre del cliente
- `customer_email` (text): Email del cliente
- `subtotal` (numeric): Subtotal de la venta
- `amount` (numeric): Monto total
- `tax` (numeric): Impuestos (18%)
- `date` (timestamp): Fecha de la venta
- `items` (jsonb): Detalles de productos vendidos

#### `clients`
- `id` (uuid): Identificador único
- `name` (text): Nombre del cliente
- `email` (text): Email
- `phone` (text): Teléfono

#### `loans`
- `id` (uuid): Identificador único
- `loan_number` (text): Número de préstamo
- `client_id` (uuid): FK a clients
- `loan_date` (timestamp): Fecha del préstamo
- `start_date` (timestamp): Fecha de inicio
- `due_date` (timestamp): Fecha de vencimiento
- `principal` (numeric): Monto principal
- `interest_rate` (numeric): Tasa de interés (%)
- `amount` (numeric): Monto solicitado
- `amount_to_pay` (numeric): Total a pagar
- `amount_applied` (numeric): Total abonado
- `overdue_amount` (numeric): Monto vencido
- `late_fee` (numeric): Mora acumulada
- `total_pending` (numeric): Saldo pendiente
- `status` (text): Estado del préstamo

#### `loan_installments`
- `id` (serial): Identificador único
- `loan_id` (uuid): FK a loans
- `installment_number` (integer): Número de cuota
- `due_date` (timestamp): Fecha de vencimiento
- `principal_amount` (numeric): Monto del principal
- `interest_amount` (numeric): Monto de interés
- `paid_amount` (numeric): Monto pagado
- `late_fee` (numeric): Mora
- `status` (text): Estado de la cuota
- `payment_date` (timestamp): Fecha de pago

#### `users`
- `id` (uuid): Identificador único
- `name` (text): Nombre del usuario
- `email` (text): Email (único)
- `role` (text): Rol (admin, cashier, employee, user)
- `password_hash` (text): Hash de contraseña

---

## 🎨 Diseño y UX

### Paleta de Colores
- **Primario**: Dark Blue (#3F51B5) - Profesionalismo y confianza
- **Fondo**: Light Gray (#F5F5F5) - Limpio y moderno
- **Acento**: Orange (#FF9800) - Acciones importantes y alertas
- **Fuente**: PT Sans - Humanist sans-serif

### Componentes UI Reutilizables
- Buttons (variants: default, destructive, outline, secondary, ghost, link)
- Inputs (text, number, email, password)
- Selects y Dropdowns
- Modals y Dialogs
- Cards
- Tables con ordenamiento y filtros
- Toasts y Notificaciones
- Progress Bars
- Tabs y Accordions
- Date Pickers
- Tooltips

### Experiencia de Usuario
- Interfaz intuitiva y fácil de usar
- Transiciones suaves
- Feedback visual inmediato
- Responsive design (móvil, tablet, desktop)
- Teclado shortcuts para acciones comunes
- Carga progresiva de datos
- Estados de carga optimizados

---

## 🔒 Seguridad

### Implementaciones de Seguridad
- **Autenticación**: Sesiones seguras con Supabase Auth
- **Autorización**: Row Level Security (RLS) en Supabase
- **Passwords**: Hash con bcrypt (10 rounds)
- **Middleware**: Protección de rutas sensibles
- **CORS**: Configuración permisiva controlada
- **CSP**: Content Security Policy en next.config
- **Validación**: Schemas con Zod en formularios
- **Sanitización**: Validación de inputs en cliente y servidor

---

## 🚀 Rendimiento y Optimización

### Optimizaciones Implementadas
- **Turbopack**: Build tool ultrarrápido para desarrollo
- **App Router**: Mejoras de Next.js 15
- **Server Components**: Reducción de JavaScript del cliente
- **Code Splitting**: Carga bajo demanda
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Preconnect a Google Fonts
- **Bundle Analysis**: Herramientas para analizar tamaño

### Métricas
- Cobertura de tests para módulos críticos (loans, sales)
- TypeScript strict mode
- ESLint configurado
- Vitest para testing unitario

---

## 📦 Deployment

### Opciones de Despliegue

#### Docker (Recomendado)
- Dockerfile optimizado
- Docker Compose para orchestración
- Scripts de utilidad (PowerShell, Bash, Makefile)
- Variables de entorno configurables
- Modo producción optimizado

#### Vercel / Netlify
- Compatible con despliegue en plataformas serverless
- Variables de entorno en dashboard
- Despliegue automático desde Git

#### VPS / Servidor Dedicado
- Node.js 20+ requerido
- PM2 para gestión de procesos
- Nginx como reverse proxy

---

## 🔮 Roadmap y Características Futuras

### Planificadas
- [ ] Dashboard personalizable con widgets
- [ ] Reportes avanzados con filtros complejos
- [ ] Integración con pasarelas de pago
- [ ] Aplicación móvil nativa
- [ ] Multi-tienda / Multi-sucursal
- [ ] Backup automático
- [ ] Notificaciones push para cuotas vencidas
- [ ] Sistema de comisiones para vendedores
- [ ] Integración con contabilidad
- [ ] API pública documentada

### En Consideración
- Soporte para múltiples monedas
- Internacionalización (i18n)
- Modo oscuro
- Temas personalizables
- Importación/exportación masiva de datos
- Integración con WhatsApp para notificaciones
- Sistema de inventario multi-almacén

---

## 📄 Licencia

Este proyecto es de uso privado. Todos los derechos reservados.
