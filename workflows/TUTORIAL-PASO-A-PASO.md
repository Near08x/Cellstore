# 🎓 TUTORIAL PASO A PASO - Tu Primer Workflow en n8n

## ✅ Pre-requisitos Completados

- [x] Docker corriendo
- [x] n8n instalado y accesible
- [x] Credenciales listas

---

## 🚀 PASO 1: Acceder a n8n

### Acción:
1. Abre tu navegador
2. Ve a: **http://localhost:5678**
3. Ingresa credenciales:
   - **Usuario:** `admin`
   - **Contraseña:** `StudioN8n2026!`

### ¿Qué verás?
- La página de bienvenida de n8n
- El dashboard principal con opciones para crear workflows

---

## 🔑 PASO 2: Configurar Credenciales de Supabase

**¿Por qué?** n8n necesita autenticarse con Supabase para acceder a tus datos.

### Acción:

1. **Click en el ícono de engranaje** ⚙️ (Settings) en la barra lateral izquierda

2. **Click en "Credentials"** en el menú que aparece

3. **Click en el botón "+ Add Credential"** (arriba a la derecha)

4. **En el buscador, escribe:** `HTTP Header Auth`

5. **Selecciona:** "HTTP Header Auth"

6. **Llena el formulario:**
   ```
   Name: Supabase API
   
   Header Name: apikey
   
   Header Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdmtzeHB4Z3lrd2Z2YXV5am50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTIxMzUsImV4cCI6MjA3NDc2ODEzNX0.Wu566nOPilAocAK54vCriv-FU1lrM3yOys06-MSVnIQ
   ```

7. **Click en "Save"**

### ✅ Verificación:
- Deberías ver "Supabase API" en la lista de credenciales
- El ícono debe estar verde/activo

---

## 📥 PASO 3: Importar el Workflow de Tutorial

**Tengo un workflow pre-configurado listo para ti!**

### Opción A: Importar desde Archivo (MÁS FÁCIL)

1. **Click en "Workflows"** en la barra lateral

2. **Click en el botón "+ Add workflow"** (arriba a la derecha)

3. **Click en el menú de tres puntos** ⋮ (arriba a la derecha)

4. **Selecciona "Import from file"**

5. **Navega a:** `C:\Users\rober\OneDrive\DESKTOP\studio-main\workflows\`

6. **Selecciona:** `01-tutorial-primer-workflow.json`

7. **Click "Open"** o **"Import"**

### Opción B: Crear Manualmente (APRENDER MÁS)

Si prefieres crear el workflow desde cero, sigue estos pasos:

1. **Click en "+ Add workflow"**

2. **Dale un nombre:** "Mi Primer Workflow"

3. **Arrastra estos nodos desde el panel derecho:**

   **Nodo 1: Manual Trigger**
   - Busca: "Manual Trigger"
   - Arrastra al canvas
   - Este será el punto de inicio

   **Nodo 2: HTTP Request**
   - Busca: "HTTP Request"
   - Arrastra al canvas, a la derecha del trigger
   - Configura:
     - **URL:** `https://ycvksxpxgykwfvauyjnt.supabase.co/rest/v1/loans`
     - **Method:** GET
     - **Authentication:** Supabase API (la que creaste)
     - **Query Parameters:**
       - `status` = `eq.Pendiente`
       - `select` = `id,loan_number,client_name,amount,total_pending`

   **Nodo 3: Code (JavaScript)**
   - Busca: "Code"
   - Arrastra al canvas, a la derecha del HTTP Request
   - En el editor, pega este código:
   ```javascript
   // Procesar datos de préstamos
   const prestamos = $input.all();

   // Calcular totales
   const totalPrestamos = prestamos.length;
   const montoTotal = prestamos.reduce((sum, item) => {
     return sum + (item.json.total_pending || 0);
   }, 0);

   const montoPromedio = totalPrestamos > 0 ? montoTotal / totalPrestamos : 0;

   // Formatear resultado
   return {
     json: {
       resumen: {
         total_prestamos: totalPrestamos,
         monto_total_pendiente: montoTotal,
         monto_promedio: montoPromedio.toFixed(2)
       },
       prestamos: prestamos.map(p => ({
         numero: p.json.loan_number,
         cliente: p.json.client_name,
         monto: p.json.amount,
         pendiente: p.json.total_pending
       }))
     }
   };
   ```

4. **Conecta los nodos:**
   - Arrastra desde el círculo de salida del Manual Trigger → HTTP Request
   - Arrastra desde el círculo de salida del HTTP Request → Code

5. **Guarda el workflow:** Click en "Save" arriba

---

## ▶️ PASO 4: Ejecutar el Workflow

### Acción:

1. **Asegúrate de que el workflow esté abierto**

2. **Click en el botón "Test workflow"** (arriba a la derecha)
   - El botón cambiará de gris a morado

3. **Click en "Execute workflow"** (el botón morado grande)

4. **Observa la magia:**
   - Verás una animación de los datos fluyendo entre nodos
   - Los nodos se iluminarán en verde ✅ si tienen éxito
   - Se iluminarán en rojo ❌ si hay error

### ✅ Éxito se ve así:

```
[Manual Trigger] → ✅
    ↓
[HTTP Request] → ✅ (X items returned)
    ↓
[Code] → ✅ (1 item)
```

### ❌ Si hay error:

**Error común 1:** "Authentication failed"
- Solución: Revisa que la credencial "Supabase API" esté seleccionada en el nodo HTTP Request

**Error común 2:** "No items returned"
- Solución: Puede que no tengas préstamos con status "Pendiente"
- Prueba: Quita el filtro `status=eq.Pendiente` temporalmente

**Error común 3:** "Network error"
- Solución: Verifica que Supabase esté accesible
- Prueba: Abre https://ycvksxpxgykwfvauyjnt.supabase.co en tu navegador

---

## 🔍 PASO 5: Ver los Resultados

### Acción:

1. **Click en el nodo "Code" (o "Procesar y Formatear")**

2. **Mira la pestaña "OUTPUT"** en el panel derecho

3. **Deberías ver algo como:**

```json
{
  "resumen": {
    "total_prestamos": 3,
    "monto_total_pendiente": 15000,
    "monto_promedio": "5000.00"
  },
  "prestamos": [
    {
      "numero": "L-001",
      "cliente": "Juan Pérez",
      "monto": 10000,
      "pendiente": 5000
    },
    {
      "numero": "L-002",
      "cliente": "María García",
      "monto": 8000,
      "pendiente": 6000
    },
    {
      "numero": "L-003",
      "cliente": "Carlos López",
      "monto": 6000,
      "pendiente": 4000
    }
  ]
}
```

### 🎉 ¡Felicidades!

**Acabas de:**
- ✅ Conectar n8n con Supabase
- ✅ Hacer una consulta a tu base de datos
- ✅ Procesar datos con JavaScript
- ✅ Ver resultados en tiempo real

---

## 🎮 PASO 6: Experimentar (Opcional)

Ahora que funciona, prueba modificarlo:

### Experimento 1: Cambiar el Filtro

1. Click en el nodo "HTTP Request"
2. En Query Parameters, cambia:
   - De: `status` = `eq.Pendiente`
   - A: `status` = `eq.Pagado`
3. Ejecuta de nuevo
4. Verás préstamos pagados en lugar de pendientes

### Experimento 2: Agregar Más Campos

1. Click en el nodo "HTTP Request"
2. En Query Parameters, modifica `select`:
   - Agrega: `,start_date,due_date,interest_rate`
3. Ejecuta de nuevo
4. Verás más información en los resultados

### Experimento 3: Agregar un Email

1. Busca el nodo "Gmail" o "Send Email"
2. Arrástralo después del nodo "Code"
3. Conéctalo
4. Configura el email con los resultados
5. ¡Recibirás un resumen por email!

---

## 📚 PASO 7: Próximos Pasos

Ahora que dominas lo básico, puedes:

### A. Hacer el Workflow Automático

Cambia el "Manual Trigger" por:
- **Schedule Trigger** (Cron) → Se ejecuta automáticamente cada X tiempo
- **Webhook** → Se ejecuta cuando tu app le envía datos

### B. Crear Workflows Más Complejos

Revisa los ejemplos en:
- [N8N_GUIDE.md](../N8N_GUIDE.md) - 5 workflows recomendados
- [workflows/README.md](./README.md) - Más ejemplos

### C. Agregar Acciones

Después de obtener los datos, puedes:
- Enviar emails
- Enviar WhatsApp (con Twilio)
- Actualizar Google Sheets
- Crear tickets en sistemas externos
- Enviar notificaciones a Slack/Discord

---

## 🆘 ¿Necesitas Ayuda?

### Error en el workflow:
- Click en el nodo con error
- Lee el mensaje en el panel "ERROR"
- Busca la solución en la sección "Troubleshooting"

### No sabes qué hacer:
- Lee [N8N_GUIDE.md](../N8N_GUIDE.md)
- Visita https://docs.n8n.io/
- Explora workflows de ejemplo en n8n.io/workflows

### Quieres implementar algo específico:
- Dime qué necesitas y te ayudo a crearlo

---

## ✅ Checklist de Completado

- [ ] Accedí a n8n en http://localhost:5678
- [ ] Configuré las credenciales de Supabase
- [ ] Importé o creé el workflow de tutorial
- [ ] Ejecuté el workflow exitosamente
- [ ] Vi los resultados en el nodo Code
- [ ] Experimenté modificando el workflow
- [ ] Entiendo cómo funciona el flujo de datos

---

## 🎉 ¡LO LOGRASTE!

Ahora sabes:
- Cómo crear workflows en n8n
- Cómo conectar con Supabase
- Cómo procesar datos con JavaScript
- Cómo ejecutar y debuggear workflows

**Siguiente nivel:**
1. Automatiza el workflow con Schedule Trigger
2. Agrega notificaciones por email
3. Crea un webhook para disparar desde tu app

**¡Disfruta automatizando tu negocio! 🚀**

---

**¿Listo para el siguiente paso?**  
Revisa [N8N_GUIDE.md](../N8N_GUIDE.md) para workflows más avanzados.
