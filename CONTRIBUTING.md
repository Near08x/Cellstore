# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a Studio! Esta guía te ayudará a entender cómo trabajamos y cómo puedes contribuir de manera efectiva.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#-código-de-conducta)
2. [Cómo Empezar](#-cómo-empezar)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Flujo de Trabajo](#-flujo-de-trabajo)
5. [Estándares de Código](#-estándares-de-código)
6. [Testing](#-testing)
7. [Commits y Pull Requests](#-commits-y-pull-requests)
8. [Documentación](#-documentación)

---

## 📜 Código de Conducta

Este proyecto se adhiere a principios de respeto, profesionalismo y colaboración. Se espera que todos los contribuyentes:

- Sean respetuosos en las comunicaciones
- Acepten críticas constructivas
- Se enfoquen en lo mejor para el proyecto
- Muestren empatía hacia otros miembros de la comunidad

---

## 🚀 Cómo Empezar

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub, luego:
git clone https://github.com/TU_USUARIO/studio-main.git
cd studio-main
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Environment

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase de desarrollo.

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:9000

---

## 📁 Estructura del Proyecto

### Arquitectura en Capas

```
src/
├── app/           # Next.js App Router (rutas y API endpoints)
├── modules/       # Lógica de negocio (service + repository + calculator)
├── schemas/       # Validación con Zod
├── components/    # Componentes React
├── lib/           # Utilidades y helpers
└── hooks/         # Custom hooks
```

### Módulo de Ejemplo (Loans)

```
src/modules/loans/
├── loans.calculator.ts    # Funciones puras de cálculo (sin efectos secundarios)
├── loans.repository.ts    # Acceso a datos (Supabase queries)
└── loans.service.ts       # Orquestación de negocio (coordina calculator + repository)
```

**Principio de Separación de Responsabilidades:**
- **Calculator**: Solo cálculos, funciones puras
- **Repository**: Solo acceso a datos, queries a Supabase
- **Service**: Orquestación, coordina calculator y repository

---

## 🔄 Flujo de Trabajo

### 1. Crear una Rama

```bash
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/descripcion-del-bug
```

**Convenciones de nombres:**
- `feature/` - Nueva funcionalidad
- `fix/` - Corrección de bug
- `refactor/` - Refactorización sin cambiar funcionalidad
- `docs/` - Cambios solo en documentación
- `test/` - Agregar o mejorar tests

### 2. Hacer Cambios

- Sigue los [estándares de código](#-estándares-de-código)
- Agrega tests si introduces nueva lógica
- Actualiza documentación si cambias APIs

### 3. Ejecutar Tests

```bash
npm run typecheck    # Verificar tipos TypeScript
npm test             # Ejecutar tests unitarios
npm run build        # Verificar que compile
```

### 4. Commit y Push

```bash
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/nombre-descriptivo
```

### 5. Abrir Pull Request

- Ve a GitHub y abre un PR desde tu rama
- Describe qué cambios hiciste y por qué
- Espera revisión antes de hacer merge

---

## ⚙️ Estándares de Código

### TypeScript

- **Siempre tipea tus funciones**:
  ```typescript
  // ✅ Bueno
  export function calculateTotal(items: Item[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
  }

  // ❌ Malo
  export function calculateTotal(items: any): any {
    return items.reduce((sum, item) => sum + item.price, 0);
  }
  ```

- **Evita `any`**: Usa tipos específicos o `unknown` si es necesario
- **Usa tipos inferidos cuando sean claros**:
  ```typescript
  const total = calculateTotal(items); // tipo inferido: number ✅
  ```

### JSDoc

Todas las funciones públicas (exportadas) deben tener JSDoc:

```typescript
/**
 * Calcula el total de una lista de items
 * 
 * @param items - Array de items con precio
 * @returns Suma total de los precios
 * 
 * @example
 * ```typescript
 * const items = [{ price: 100 }, { price: 200 }];
 * calculateTotal(items); // 300
 * ```
 */
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Naming Conventions

- **Archivos**: `kebab-case.ts`
- **Componentes React**: `PascalCase.tsx`
- **Funciones**: `camelCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Tipos/Interfaces**: `PascalCase`

```typescript
// ✅ Correcto
const MAX_RETRIES = 3;
type UserRole = 'admin' | 'cashier';
export function getUserById(id: string): User { ... }
```

### Formateo

- **Indentación**: 2 espacios
- **Comillas**: Simples `'` para strings
- **Punto y coma**: Siempre al final de statements
- **Imports**: Agrupa por tipo (React, librerías, local)

```typescript
// ✅ Orden de imports
import { useState } from 'react';
import { z } from 'zod';
import { calculateTotal } from '@/lib/utils';
```

---

## 🧪 Testing

### Cuándo Escribir Tests

**Siempre testea:**
- ✅ Funciones puras (calculators)
- ✅ Lógica de negocio (services)
- ✅ Validaciones (schemas)
- ✅ Utilidades compartidas

**No es necesario testear:**
- ❌ Componentes React simples (solo UI)
- ❌ Configuración (next.config.ts)
- ❌ Tipos TypeScript

### Estructura de Tests

```typescript
// src/modules/loans/loans.calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateInstallments } from './loans.calculator';

describe('calculateInstallments', () => {
  it('should calculate monthly installments correctly', () => {
    const result = calculateInstallments(10000, 12, 12, 'Mensual', '2025-01-01');
    
    expect(result).toHaveLength(12);
    expect(result[0].principal_amount).toBe(833.33);
    expect(result[0].interest_amount).toBe(100);
  });

  it('should handle edge case: zero interest', () => {
    const result = calculateInstallments(1000, 0, 5, 'Mensual', '2025-01-01');
    
    expect(result[0].interest_amount).toBe(0);
  });
});
```

### Ejecutar Tests

```bash
npm test              # Todos los tests
npm run test:ui       # UI interactiva
npm run test:coverage # Con coverage
```

---

## 📝 Commits y Pull Requests

### Formato de Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<scope>): <descripción>

[cuerpo opcional]
[footer opcional]
```

**Tipos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `refactor`: Refactorización
- `docs`: Cambios en documentación
- `test`: Agregar o mejorar tests
- `chore`: Mantenimiento (deps, config)

**Ejemplos:**
```bash
feat(loans): add late fee calculation
fix(pos): correct tax calculation on discounts
refactor(loans): extract payment distribution to calculator
docs(readme): update architecture diagram
test(loans): add tests for payment distribution
```

### Pull Request Checklist

Antes de abrir un PR, verifica:

- [ ] El código compila sin errores (`npm run build`)
- [ ] Los tipos TypeScript son correctos (`npm run typecheck`)
- [ ] Todos los tests pasan (`npm test`)
- [ ] Agregaste JSDoc a funciones nuevas
- [ ] Actualizaste documentación si es necesario
- [ ] El commit sigue Conventional Commits
- [ ] La descripción del PR explica QUÉ y POR QUÉ

**Template de PR:**
```markdown
## 🎯 Objetivo
Descripción breve de qué resuelve este PR

## 🔄 Cambios
- Cambio 1
- Cambio 2

## 🧪 Testing
- [ ] Tests unitarios agregados
- [ ] Probado manualmente en desarrollo

## 📸 Screenshots (si aplica)
[Capturas de pantalla]

## 📚 Documentación
- [ ] README actualizado
- [ ] JSDoc agregado
```

---

## 📚 Documentación

### Cuándo Actualizar Docs

**Actualiza documentación si:**
- Agregas nuevas funcionalidades
- Cambias APIs públicas
- Modificas flujos de trabajo
- Cambias estructura de proyecto

### Dónde Documentar

- **README.md**: Overview del proyecto, setup, arquitectura
- **CONTRIBUTING.md**: Esta guía (contribución)
- **DOCKER.md**: Todo relacionado a Docker
- **docs/**: Documentación detallada de módulos
- **JSDoc**: Documentación inline de funciones

### Estilo de Documentación

- **Sé claro y conciso**: Evita jerga innecesaria
- **Usa ejemplos**: Código de ejemplo ayuda a entender
- **Mantén actualizado**: Docs desactualizados son peor que no tener docs
- **Usa emojis**: Hacen la lectura más amena (pero no abuses)

---

## 🔍 Code Review

### Qué Buscar al Revisar

- ✅ Código sigue estándares del proyecto
- ✅ Tests cubren los cambios
- ✅ Documentación actualizada
- ✅ No hay lógica duplicada
- ✅ Nombres descriptivos (variables, funciones)
- ✅ Manejo de errores apropiado
- ✅ Performance aceptable

### Cómo Dar Feedback

**✅ Bueno:**
```
Esta función podría simplificarse usando Array.reduce().
Aquí un ejemplo: [código]
```

**❌ Malo:**
```
Este código es horrible, re-escríbelo.
```

**Principios:**
- Sé específico y constructivo
- Sugiere soluciones, no solo problemas
- Pregunta cuando no entiendas algo
- Aprueba cuando esté listo (no esperes perfección)

---

## 🐛 Reportar Bugs

### Información Necesaria

Al reportar un bug, incluye:

1. **Descripción**: Qué esperabas vs qué pasó
2. **Pasos para reproducir**: 
   1. Ve a...
   2. Haz click en...
   3. Observa error
3. **Environment**: Browser, OS, versión de Node
4. **Screenshots**: Si aplica
5. **Logs**: Errores de consola

---

## ❓ Preguntas Frecuentes

### ¿Cómo agrego un nuevo módulo?

1. Crea carpeta en `src/modules/nombre-modulo/`
2. Implementa: `calculator.ts`, `repository.ts`, `service.ts`
3. Agrega tests en archivos `.test.ts`
4. Crea schemas de validación en `src/schemas/`
5. Documenta en `docs/`

### ¿Dónde va la lógica de negocio?

- **Cálculos puros**: `*.calculator.ts`
- **Orquestación**: `*.service.ts`
- **Queries DB**: `*.repository.ts`

### ¿Cómo manejo errores?

```typescript
// Service layer
try {
  const result = await repository.getData();
  return result;
} catch (error) {
  logger.error('Error fetching data', { error });
  throw new Error('Failed to fetch data');
}

// API route
try {
  const data = await service.getData();
  return Response.json(data);
} catch (error) {
  logger.error('API error', { error });
  return Response.json({ error: 'Internal error' }, { status: 500 });
}
```

### ¿Cuándo usar server vs client components?

**Server Components (default):**
- Fetching de datos
- Acceso a backend resources
- Información sensible

**Client Components (`'use client'`):**
- Interactividad (useState, useEffect)
- Event handlers (onClick, onChange)
- Browser APIs (window, localStorage)

---

## 📞 Contacto

¿Tienes preguntas? Abre un issue en GitHub con la etiqueta `question`.

---

¡Gracias por contribuir a Studio! 🎉
