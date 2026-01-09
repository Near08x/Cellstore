# 🔄 n8n Integration Guide - Studio App

## 📖 ¿Qué es n8n?

**n8n** es una plataforma de automatización de workflows (flujos de trabajo) que permite conectar diferentes servicios y automatizar tareas sin escribir código. Es la versión open-source de herramientas como Zapier o Make.

### Para Studio App, n8n te permite:

✅ **Notificaciones automáticas** (recordatorios de pago, alertas de mora)  
✅ **Cálculos programados** (mora diaria, actualización de estados)  
✅ **Integraciones** (WhatsApp, Email, Google Sheets, etc.)  
✅ **Reportes automáticos** (PDF diarios/semanales/mensuales)  
✅ **Backups** (exportación automática de datos)  

---

## 🚀 Inicio Rápido

### 1. Iniciar n8n con Docker

```bash
# Levantar todo el stack (App + n8n)
docker-compose up -d

# Solo n8n
docker-compose up -d n8n

# Ver logs de n8n
docker-compose logs -f n8n
```

### 2. Acceder a n8n

🌐 **URL:** http://localhost:5678

**Credenciales por defecto:**
- **Usuario:** admin
- **Contraseña:** StudioN8n2026!

⚠️ **IMPORTANTE:** Cambiar estas credenciales en producción editando `.env`:
```env
N8N_USER=tu-usuario
N8N_PASSWORD=tu-password-seguro
```

---

## 📋 Workflows Recomendados para Studio

### 1️⃣ Recordatorios Diarios de Pago

**Objetivo:** Enviar recordatorio a clientes con cuotas que vencen mañana

**Trigger:** Cron - Diario a las 8:00 AM

**Pasos:**
```
1. HTTP Request a Supabase
   GET /rest/v1/loan_installments
   ?status=eq.Pendiente
   &due_date=eq.{mañana}
   
2. Loop: Por cada cuota
   
3. HTTP Request: Obtener datos del cliente
   GET /rest/v1/clients
   ?id=eq.{client_id}
   
4. Send Email/WhatsApp
   "Hola {nombre}, tu cuota de ${amount} vence mañana"
```

**Nodos necesarios:**
- Schedule Trigger (Cron)
- HTTP Request (Supabase)
- Loop
- Gmail / Twilio (WhatsApp)

---

### 2️⃣ Cálculo Automático de Mora

**Objetivo:** Calcular y actualizar mora diaria en cuotas vencidas

**Trigger:** Cron - Diario a las 00:01 AM

**Pasos:**
```
1. HTTP Request a Supabase
   GET /rest/v1/loan_installments
   ?status=eq.Atrasado
   &due_date=lt.{hoy}
   
2. Loop: Por cada cuota vencida
   
3. Function: Calcular mora
   días_atraso = (hoy - due_date).days
   mora = principal_amount * 0.04 * días_atraso / 30
   
4. HTTP Request: Update Supabase
   PATCH /rest/v1/loan_installments
   { late_fee: {mora} }
   
5. HTTP Request: Update loan total
   UPDATE loans SET overdue_amount += {mora}
```

**Nodos necesarios:**
- Schedule Trigger (Cron)
- HTTP Request (Supabase)
- Loop
- Function (JavaScript)
- Update Database

---

### 3️⃣ Alertas de Stock Bajo

**Objetivo:** Notificar cuando productos tienen stock bajo

**Trigger:** Cron - Cada 6 horas

**Pasos:**
```
1. HTTP Request a Supabase
   GET /rest/v1/products
   ?stock=lt.10
   
2. IF productos.length > 0:
   
3. Function: Formatear lista
   productos.map(p => `${p.name}: ${p.stock} unidades`)
   
4. Send Email
   To: compras@tuempresa.com
   Subject: "Alerta: Stock Bajo"
   Body: {lista_formateada}
```

---

### 4️⃣ Backup Automático Semanal

**Objetivo:** Exportar datos a Google Drive cada domingo

**Trigger:** Cron - Domingos a las 2:00 AM

**Pasos:**
```
1. HTTP Request: Export loans
   GET /rest/v1/loans
   
2. HTTP Request: Export clients
   GET /rest/v1/clients
   
3. HTTP Request: Export sales
   GET /rest/v1/sales
   
4. Function: Convert to CSV
   
5. Google Drive: Upload files
   folder: "Studio Backups"
   filename: "backup_{fecha}.csv"
   
6. Email: Notificar admin
   "Backup completado: {archivos}"
```

---

### 5️⃣ Webhook: Nueva Venta → Acciones

**Objetivo:** Cuando se registra una venta, ejecutar múltiples acciones

**Trigger:** Webhook - POST desde tu app

**Pasos:**
```
1. Webhook Trigger
   URL: http://localhost:5678/webhook/nueva-venta
   
2. Parallel Branches:
   
   A. Enviar recibo por email
      - Get client info
      - Generate PDF
      - Send email
   
   B. Actualizar Google Sheets
      - Append row con detalles de venta
   
   C. Notificar Slack/Teams
      - "Nueva venta: ${monto} - Cliente: ${nombre}"
   
   D. Update Analytics Dashboard
      - Increment counter
```

**Implementación en tu app:**
```typescript
// src/app/api/sales/route.ts
export async function POST(req: Request) {
  // ... crear venta
  
  // Trigger n8n workflow
  await fetch('http://n8n:5678/webhook/nueva-venta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sale_id: newSale.id,
      customer: customerData,
      amount: total,
      items: saleItems
    })
  });
  
  return NextResponse.json({ success: true });
}
```

---

## 🔌 Conectar n8n con Supabase

### Opción 1: HTTP Request (Recomendado)

```javascript
// Configuración de nodo HTTP Request en n8n
URL: https://ycvksxpxgykwfvauyjnt.supabase.co/rest/v1/loans
Method: GET
Authentication: Generic Credential Type
Headers:
  - apikey: {tu-supabase-anon-key}
  - Authorization: Bearer {tu-supabase-anon-key}
  - Content-Type: application/json
```

### Opción 2: Supabase Node (si disponible)

```javascript
// Credenciales en n8n
Host: ycvksxpxgykwfvauyjnt.supabase.co
Anon Key: {tu-anon-key}
Service Role Key: {tu-service-role-key}
```

---

## 🌐 Webhooks: App → n8n

### Crear Webhook en n8n

1. Nuevo workflow
2. Agregar nodo "Webhook"
3. Configurar:
   - HTTP Method: POST
   - Path: `/webhook/loan-created`
   - Response: JSON

4. Copiar URL generada

### Llamar desde Studio App

```typescript
// src/app/api/loans/route.ts
export async function POST(req: Request) {
  const loan = await createLoan(data);
  
  // Trigger n8n (async, no espera respuesta)
  fetch('http://n8n:5678/webhook/loan-created', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loan_id: loan.id,
      client_id: loan.client_id,
      amount: loan.amount,
      installments: loan.installments
    })
  }).catch(err => console.error('n8n webhook failed:', err));
  
  return NextResponse.json({ loan });
}
```

---

## 🔒 Seguridad

### Autenticación Básica (Actual)

```env
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=StudioN8n2026!
```

### Para Producción

1. **Cambiar credenciales:**
```env
N8N_USER=tu-usuario-seguro
N8N_PASSWORD=Password.Complejo123!
```

2. **Usar HTTPS:**
```env
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.tudominio.com/
```

3. **Encryption Key única:**
```env
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

---

## 📊 Integraciones Populares

### Email (Gmail)

**Nodo:** Gmail
**Configuración:**
- Crear OAuth2 credentials en Google Cloud
- Scopes: gmail.send, gmail.readonly

### WhatsApp (Twilio)

**Nodo:** Twilio
**Configuración:**
- Account SID
- Auth Token
- WhatsApp number

### Google Sheets

**Nodo:** Google Sheets
**Casos de uso:**
- Exportar ventas diarias
- Dashboard para gerencia
- Reportes automáticos

### Slack/Discord/Teams

**Nodo:** Slack / Discord / Microsoft Teams
**Casos de uso:**
- Notificaciones de equipo
- Alertas importantes
- Métricas en tiempo real

---

## 🛠️ Comandos Útiles

### Gestión de n8n

```bash
# Iniciar solo n8n
docker-compose up -d n8n

# Reiniciar n8n
docker-compose restart n8n

# Ver logs
docker-compose logs -f n8n

# Detener n8n
docker-compose stop n8n

# Acceder a shell de n8n
docker-compose exec n8n sh

# Ver workflows activos
docker-compose exec n8n n8n list:workflow --active=true
```

### Backup de Workflows

```bash
# Exportar workflows
docker-compose exec n8n n8n export:workflow --all --output=/home/node/.n8n/workflows-backup.json

# Copiar desde container
docker cp studio-n8n:/home/node/.n8n/workflows-backup.json ./n8n-backup/
```

### Importar Workflows

```bash
# Copiar al container
docker cp ./workflows.json studio-n8n:/home/node/.n8n/

# Importar
docker-compose exec n8n n8n import:workflow --input=/home/node/.n8n/workflows.json
```

---

## 📚 Recursos

### Documentación Oficial
- 🌐 [n8n Docs](https://docs.n8n.io/)
- 🎓 [n8n Academy](https://academy.n8n.io/)
- 💬 [Community Forum](https://community.n8n.io/)

### Ejemplos de Workflows
- 📦 [n8n Workflows](https://n8n.io/workflows/)
- 🔧 [Templates](https://n8n.io/workflows/templates/)

### Integraciones
- 🔌 [Available Nodes](https://n8n.io/integrations/)
- 📖 [Supabase Integration](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.supabase/)

---

## 🚨 Troubleshooting

### n8n no inicia

```bash
# Ver logs detallados
docker-compose logs n8n

# Verificar puertos
netstat -ano | findstr :5678

# Reiniciar completamente
docker-compose down
docker-compose up -d
```

### Webhook no responde

```bash
# Verificar conectividad desde app a n8n
docker-compose exec app wget -O- http://n8n:5678/healthz

# Verificar network
docker network inspect studio-main_studio-network
```

### Credenciales no funcionan

```bash
# Resetear autenticación
docker-compose down
docker volume rm studio-main_n8n_data
docker-compose up -d n8n
```

---

## 🎯 Ejemplos Listos para Usar

### Template 1: Recordatorio de Pago

```json
{
  "name": "Recordatorio Diario de Pagos",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{ "field": "cronExpression", "expression": "0 8 * * *" }]
        }
      }
    },
    {
      "name": "Get Cuotas Mañana",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://ycvksxpxgykwfvauyjnt.supabase.co/rest/v1/loan_installments",
        "queryParameters": {
          "parameters": [
            { "name": "status", "value": "eq.Pendiente" },
            { "name": "due_date", "value": "={{$today.plus({days: 1}).toFormat('yyyy-MM-dd')}}" }
          ]
        }
      }
    }
  ]
}
```

### Template 2: Webhook Nueva Venta

Ver en: http://localhost:5678 → Templates → Import

---

## ✅ Checklist de Configuración

- [x] n8n instalado en docker-compose
- [x] Variables de entorno configuradas
- [ ] Acceder a http://localhost:5678
- [ ] Cambiar credenciales por defecto
- [ ] Configurar primer workflow
- [ ] Probar webhook desde app
- [ ] Conectar con Supabase
- [ ] Configurar notificaciones (Email/WhatsApp)
- [ ] Programar backup automático
- [ ] Documentar workflows custom

---

## 🎉 Siguiente Paso

1. **Accede a n8n:** http://localhost:5678
2. **Login:** admin / StudioN8n2026!
3. **Crear primer workflow:** Recordatorio de pagos
4. **Probar webhook:** Desde Postman o tu app

**¡Disfruta automatizando tu negocio! 🚀**
