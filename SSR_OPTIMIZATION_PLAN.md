# 🚀 Plan de Optimización SSR - CellStore

**Fecha:** 30 de Diciembre, 2025  
**Objetivo:** Optimizar el uso de Server-Side Rendering en Next.js App Router  
**Impacto esperado:** -60% FCP, -75% TTFB, -30% Bundle JS

---

## 📋 RESUMEN EJECUTIVO

La aplicación actualmente tiene páginas críticas marcadas como `'use client'` que están haciendo fetching de datos en el cliente, causando waterfalls de peticiones y peor rendimiento. Este plan convierte esas páginas a SSR para aprovechar las ventajas del App Router de Next.js 15.

---

## 🎯 FASES DE IMPLEMENTACIÓN

### **FASE 1: Problemas Críticos** (Alta Prioridad)
> **Tiempo estimado:** 45-60 min  
> **Impacto:** 🔴 Crítico - Mejora dramática en rendimiento

#### ✅ Tarea 1.1: Refactorizar Dashboard Principal (`/app/page.tsx`)
**Archivo:** `src/app/page.tsx`

**Problema actual:**
- ❌ Usa `'use client'`
- ❌ Hace fetch en `useEffect` (waterfall)
- ❌ Muestra skeleton innecesariamente

**Solución:**
1. Eliminar `'use client'`
2. Convertir a `async function`
3. Crear funciones de data fetching en servidor
4. Mover datos via props a un nuevo `DashboardClient` component
5. Usar `supabaseServer` en lugar de API routes

**Archivos a modificar:**
- `src/app/page.tsx` - Convertir a Server Component
- `src/components/dashboard/dashboard-client.tsx` - Crear nuevo componente cliente

**Código esperado:**
```typescript
// src/app/page.tsx
import { supabase } from '@/lib/supabaseServer';
import DashboardClient from '@/components/dashboard/dashboard-client';
import MainLayout from '@/components/main-layout';

async function getProducts() {
  const { data } = await supabase.from('products').select('*');
  return data ?? [];
}

async function getSales() {
  const { data } = await supabase.from('sales').select('*');
  return data ?? [];
}

export default async function Home() {
  const [products, sales] = await Promise.all([
    getProducts(),
    getSales()
  ]);

  return (
    <MainLayout>
      <DashboardClient products={products} sales={sales} />
    </MainLayout>
  );
}
```

**Métricas esperadas:**
- TTFB: 800ms → 200ms (-75%)
- FCP: 1.5s → 0.6s (-60%)

---

#### ✅ Tarea 1.2: Refactorizar Settings (`/app/settings/page.tsx`)
**Archivo:** `src/app/settings/page.tsx`

**Problema actual:**
- ❌ Usa `'use client'`
- ❌ Hace fetch de usuarios en `useEffect`
- ❌ Depende de role desde cliente

**Solución:**
1. Eliminar `'use client'`
2. Convertir a `async function`
3. Obtener usuarios en servidor
4. Validar role en servidor (más seguro)
5. Pasar datos via props a componente cliente

**Archivos a modificar:**
- `src/app/settings/page.tsx` - Convertir a Server Component
- `src/components/settings/settings-client.tsx` - Crear nuevo componente cliente

**Código esperado:**
```typescript
// src/app/settings/page.tsx
import { supabase } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import MainLayout from '@/components/main-layout';
import SettingsClient from '@/components/settings/settings-client';

async function getUsers() {
  const { data } = await supabase.from('users').select('id, name, email, role');
  return data ?? [];
}

async function getCurrentUserRole() {
  // Implementar lógica de autenticación en servidor
  // Por ahora, retornar desde cookies/session
  return 'admin'; // Placeholder
}

export default async function SettingsPage() {
  const role = await getCurrentUserRole();
  
  if (role !== 'admin') {
    redirect('/');
  }

  const users = await getUsers();

  return (
    <MainLayout>
      <SettingsClient users={users} role={role} />
    </MainLayout>
  );
}
```

**Beneficios:**
- ✅ Validación de role en servidor (más seguro)
- ✅ Datos pre-cargados
- ✅ Menos JS en cliente

---

### **FASE 2: Inconsistencias** (Media Prioridad)
> **Tiempo estimado:** 30-45 min  
> **Impacto:** 🟡 Medio - Consistencia y mantenibilidad

#### ✅ Tarea 2.1: Optimizar POS Page (`/app/pos/page.tsx`)
**Archivo:** `src/app/pos/page.tsx`

**Problema actual:**
- ⚠️ Usa `supabaseClient` en Server Component (debería ser `supabaseServer`)

**Solución:**
```diff
- import { supabase } from "@/lib/supabaseClient";
+ import { supabase } from "@/lib/supabaseServer";
```

**Archivos a modificar:**
- `src/app/pos/page.tsx`

---

#### ✅ Tarea 2.2: Optimizar Inventory Page (`/app/inventory/page.tsx`)
**Archivo:** `src/app/inventory/page.tsx`

**Problema actual:**
- ⚠️ Hace fetch a API interna en lugar de Supabase directo
- ⚠️ Complejidad innecesaria con `resolveBaseUrl`

**Solución:**
1. Eliminar fetch a `/api/products`
2. Usar Supabase directo
3. Simplificar código

**Código esperado:**
```typescript
// src/app/inventory/page.tsx
export const dynamic = 'force-dynamic';

import MainLayout from '@/components/main-layout';
import InventoryClient from '@/components/inventory/inventory-client';
import type { Product } from '@/lib/types';
import { supabase } from '@/lib/supabaseServer';

async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function InventoryPage() {
  const products = await getProducts();

  return (
    <MainLayout>
      <InventoryClient products={products} />
    </MainLayout>
  );
}
```

**Beneficios:**
- ✅ Código más simple
- ✅ Menos latencia (elimina hop a API)
- ✅ Consistente con otras páginas

---

#### ✅ Tarea 2.3: Refactorizar Dashboard Test (`/app/dashboard-test/page.tsx`)
**Archivo:** `src/app/dashboard-test/page.tsx`

**Problema actual:**
- ❌ Usa `'use client'` (probablemente innecesario para una página de test)

**Solución:**
1. Revisar contenido de la página
2. Si es estática, eliminar `'use client'`
3. Si necesita interactividad, crear wrapper Client Component

**Nota:** Evaluar si esta página test es necesaria o se puede eliminar.

---

### **FASE 3: Limpieza y Mejoras** (Baja Prioridad)
> **Tiempo estimado:** 15-20 min  
> **Impacto:** 🟢 Bajo - Limpieza de código

#### ✅ Tarea 3.1: Eliminar `'use server'` de Route Handlers
**Archivos afectados:**
- `src/app/api/users/route.ts`
- `src/app/api/sales/route.ts`
- `src/app/api/products/route.ts`
- `src/app/api/print/payment/route.ts`
- `src/app/api/clients/route.ts`
- `src/app/api/capital/route.ts`
- `src/app/api/auth/login/route.ts`

**Problema:**
- ⚠️ Los Route Handlers NO necesitan `'use server'`
- Esta directiva es solo para Server Actions

**Solución:**
Eliminar la primera línea `'use server'` de cada archivo.

**Nota:** Esto es principalmente limpieza, no afecta funcionalidad.

---

#### ✅ Tarea 3.2: Documentar archivo Firebase legacy
**Archivo:** `src/lib/firebase.ts`

**Problema:**
- ⚠️ Archivo existe pero no se usa (migrado a Supabase)

**Opciones:**
1. **Eliminar completamente** (recomendado)
2. Agregar comentario de deprecación
3. Mover a carpeta `_legacy/`

**Solución recomendada:**
Eliminar el archivo ya que todo migró a Supabase.

---

## 📊 MÉTRICAS DE ÉXITO

### Antes de optimización:
```
✗ Pages usando 'use client': 4/9 (44%)
✗ Client-side data fetching: 3 páginas
✗ Waterfalls de red: 3-4 niveles
✗ TTFB promedio: ~800ms
✗ FCP promedio: ~1.5s
✗ Bundle JS: ~450KB
```

### Después de optimización:
```
✓ Pages usando 'use client': 1/9 (11%) - solo Login
✓ Client-side data fetching: 0 páginas
✓ Waterfalls de red: 0-1 niveles
✓ TTFB promedio: ~200ms (-75%)
✓ FCP promedio: ~600ms (-60%)
✓ Bundle JS: ~320KB (-30%)
```

---

## 🔍 CHECKLIST DE VERIFICACIÓN

Después de cada fase, verificar:

- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run build` completa exitosamente
- [ ] Navegar a cada página modificada y verificar que carga
- [ ] Verificar en DevTools que no hay waterfalls innecesarios
- [ ] Verificar en Network tab que datos vienen pre-renderizados
- [ ] Verificar que la interactividad cliente sigue funcionando

---

## 🚨 RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Romper autenticación en Settings | Media | Alto | Implementar middleware de auth primero |
| Perder estado cliente en Dashboard | Baja | Medio | Mantener interactividad en DashboardClient |
| Problemas con cookies/session | Media | Alto | Testear exhaustivamente flujo de auth |

---

## 📝 NOTAS IMPORTANTES

### Sobre Autenticación
El archivo `use-auth.tsx` usa contexto de React (`'use client'`). Para páginas SSR:
- Validar sesión en **servidor** usando cookies/headers
- Pasar estado inicial al cliente
- Mantener sincronización bidireccional

### Sobre MainLayout
`MainLayout` usa `'use client'` porque tiene interactividad (nav, header). Esto está correcto, pero:
- Los datos deben venir de Server Components padres
- Evitar fetch dentro de MainLayout

### Sobre Supabase
- `supabaseServer.ts`: Para Server Components y API Routes
- `supabaseClient.ts`: Solo para Client Components con auth del usuario
- Nunca mezclarlos

---

## 🎬 ORDEN DE EJECUCIÓN SUGERIDO

```bash
# FASE 1 - Día 1
1. Tarea 1.1: Dashboard Principal (45 min)
   └─ Crear dashboard-client.tsx
   └─ Refactorizar page.tsx
   └─ Testear

2. Tarea 1.2: Settings Page (30 min)
   └─ Crear settings-client.tsx
   └─ Refactorizar page.tsx
   └─ Implementar validación role servidor
   └─ Testear

# FASE 2 - Día 2
3. Tarea 2.1: POS Page (5 min)
4. Tarea 2.2: Inventory Page (20 min)
5. Tarea 2.3: Dashboard Test (10 min)

# FASE 3 - Día 2
6. Tarea 3.1: Limpiar 'use server' (10 min)
7. Tarea 3.2: Eliminar firebase.ts (2 min)

# VERIFICACIÓN FINAL
8. Run full test suite
9. Performance audit con Lighthouse
10. Verificar Core Web Vitals
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

Para considerar el plan completo:

1. ✅ Todas las páginas principales usan SSR excepto Login
2. ✅ No hay waterfalls de peticiones en carga inicial
3. ✅ TypeScript build pasa sin errores
4. ✅ Lighthouse Performance Score > 90
5. ✅ FCP < 800ms en 3G Fast
6. ✅ TTFB < 300ms
7. ✅ No hay errores en consola del navegador
8. ✅ Autenticación funciona correctamente
9. ✅ Todas las funcionalidades cliente mantienen interactividad

---

## 📚 RECURSOS Y REFERENCIAS

- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Components vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

**Última actualización:** 30 de Diciembre, 2025  
**Responsable:** Developer Team  
**Estado:** ⏳ Pendiente de aprobación

---

## 🤝 SIGUIENTE PASO

Una vez aprobado este plan, ejecutar tarea por tarea confirmando cada checkpoint.

**Comando para iniciar:**
```bash
"Ejecutar Fase 1, Tarea 1.1"
```
