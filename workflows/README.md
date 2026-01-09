# 📁 Workflows de n8n - Studio App

Esta carpeta contiene workflows pre-configurados listos para importar en n8n.

## 🚀 Cómo Importar un Workflow

### Opción 1: Desde la UI de n8n (Recomendado)

1. Accede a n8n: http://localhost:5678
2. Login con: `admin` / `StudioN8n2026!`
3. Click en **"Workflows"** en el menú lateral
4. Click en **"+ Add workflow"**
5. Click en el menú de **tres puntos** (⋮) arriba a la derecha
6. Selecciona **"Import from file"**
7. Selecciona el archivo JSON del workflow
8. Click **"Import"**

### Opción 2: Desde línea de comandos

```bash
# Copiar workflow al container
docker cp workflows/01-tutorial-primer-workflow.json studio-n8n:/home/node/.n8n/

# Importar
docker-compose exec n8n n8n import:workflow --input=/home/node/.n8n/01-tutorial-primer-workflow.json
```

---

## 📚 Workflows Disponibles

### 01-tutorial-primer-workflow.json
**Nombre:** Tutorial - Consultar Préstamos Pendientes  
**Nivel:** Principiante  
**Descripción:** Workflow básico para aprender a conectar n8n con Supabase  
**Trigger:** Manual  

**Qué hace:**
1. Se ejecuta manualmente al hacer clic en "Test workflow"
2. Consulta la tabla `loans` en Supabase
3. Filtra solo préstamos con status "Pendiente"
4. Procesa los datos y calcula totales
5. Devuelve un resumen formateado

**Antes de usar:**
- Configurar credenciales de Supabase (ver abajo)

---

## 🔐 Configurar Credenciales de Supabase

Para que los workflows funcionen, debes configurar las credenciales de Supabase en n8n:

### Paso a Paso:

1. **En n8n, ve a:** Settings (⚙️) → Credentials
2. **Click en:** "+ Add Credential"
3. **Busca:** "HTTP Header Auth"
4. **Configura:**
   - **Name:** Supabase API
   - **Header Name:** `apikey`
   - **Header Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdmtzeHB4Z3lrd2Z2YXV5am50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTIxMzUsImV4cCI6MjA3NDc2ODEzNX0.Wu566nOPilAocAK54vCriv-FU1lrM3yOys06-MSVnIQ`
5. **Click:** Save

### Agregar Header Authorization (Opcional pero recomendado):

1. En el nodo HTTP Request
2. Ve a "Headers"
3. Agrega:
   - **Name:** `Authorization`
   - **Value:** `Bearer {tu-supabase-anon-key}`

---

## 🎯 Tutorial: Usar tu Primer Workflow

### Paso 1: Importar el Workflow

Sigue las instrucciones arriba para importar `01-tutorial-primer-workflow.json`

### Paso 2: Configurar Credenciales

1. Abre el workflow importado
2. Click en el nodo "Obtener Préstamos Pendientes"
3. En "Credential to connect with", selecciona "Supabase API"
4. Si no existe, créala siguiendo la guía de arriba

### Paso 3: Ejecutar el Workflow

1. Click en **"Test workflow"** arriba a la derecha
2. Click en **"Execute workflow"** (botón morado)
3. Verás los datos fluir por los nodos
4. Al final, verás el resultado en el nodo "Procesar y Formatear"

### Paso 4: Entender el Resultado

El workflow te mostrará:
```json
{
  "resumen": {
    "total_prestamos": 5,
    "monto_total_pendiente": 15000,
    "monto_promedio": "3000.00"
  },
  "prestamos": [
    {
      "numero": "L-001",
      "cliente": "Juan Pérez",
      "monto": 5000,
      "pendiente": 3000
    }
    // ... más préstamos
  ]
}
```

### Paso 5: Modificar el Workflow

**Prueba cambiar cosas:**

1. **Cambiar el filtro:** En lugar de `status=eq.Pendiente`, prueba `status=eq.Pagado`
2. **Agregar más campos:** Modifica el parámetro `select`
3. **Agregar un nodo Email:** Para enviar los resultados por correo

---

## 🔧 Troubleshooting

### Error: "Authentication failed"
- Verifica que la credencial "Supabase API" esté configurada
- Verifica que el apikey sea correcto

### Error: "404 Not Found"
- Verifica la URL de Supabase
- Verifica que la tabla `loans` exista

### Error: "No items returned"
- Puede que no tengas préstamos con status "Pendiente"
- Prueba quitar el filtro temporalmente

### Error: "CORS error"
- Esto no debería pasar desde Docker
- Verifica que n8n y la app estén en la misma red

---

## 📖 Próximos Workflows a Crear

Una vez domines este workflow básico, puedes crear:

1. **Recordatorio automático de pagos** (Cron + Email)
2. **Webhook para nueva venta** (Webhook + múltiples acciones)
3. **Cálculo diario de mora** (Cron + Update DB)
4. **Backup a Google Drive** (Cron + Google Drive API)
5. **Notificaciones WhatsApp** (Webhook + Twilio)

---

## 🆘 Necesitas Ayuda?

- 📚 [Documentación oficial de n8n](https://docs.n8n.io/)
- 💬 [Community Forum](https://community.n8n.io/)
- 📖 [N8N_GUIDE.md](../N8N_GUIDE.md) - Guía completa local

---

**¡Feliz automatización! 🚀**
