# 🚀 Guía de Configuración en Vercel

## Variables de Entorno Requeridas

Para que la aplicación funcione correctamente en Vercel, debes configurar las siguientes variables de entorno:

### 1. Acceder a Configuración del Proyecto

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto: **Cellstore**
3. Ve a **Settings** → **Environment Variables**

### 2. Agregar Variables de Entorno

Agrega las siguientes variables para **Production**, **Preview** y **Development**:

#### Supabase (Requerido)

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**¿Dónde obtener estas credenciales?**
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### AI/Genkit (Opcional)

```env
GOOGLE_GENAI_API_KEY=AIzaSy...
```

Solo si vas a usar las funcionalidades de AI.

### 3. Redeploy

Después de agregar las variables:

1. Ve a **Deployments**
2. Click en los **3 puntos** del deployment más reciente
3. Click en **Redeploy**
4. Vercel reconstruirá con las nuevas variables

### 4. Verificar el Deploy

Una vez completado el deploy:

1. Abre la URL de tu proyecto
2. Verifica que no haya errores de Supabase
3. Intenta hacer login

## ⚠️ Problemas Comunes

### Error: "supabaseUrl is required"

**Solución**: Verifica que hayas agregado las variables de entorno y hecho redeploy.

### Vercel usa yarn en lugar de npm

**Solución**: Este proyecto está configurado para usar npm. Vercel lo detectará automáticamente por:
- Archivo `package-lock.json` presente
- Archivo `.npmrc` con configuración
- No existe `yarn.lock`

### Build falla en producción

**Solución**: 
1. Revisa los logs de build en Vercel
2. Asegúrate que las variables de entorno estén configuradas
3. Verifica que el commit más reciente esté desplegado

## 📝 Configuración Adicional (Opcional)

### Dominio Personalizado

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones

### Build & Development Settings

Vercel detecta automáticamente:
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`

No necesitas cambiar nada a menos que tengas requisitos específicos.

## 🔍 Comandos Útiles

### Verificar deployment localmente

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Hacer deploy
vercel --prod
```

### Ver logs en tiempo real

```bash
vercel logs <deployment-url>
```

## ✅ Checklist

- [ ] Variables de entorno agregadas en Vercel
- [ ] Redeploy realizado
- [ ] Login funciona correctamente
- [ ] Base de datos conectada
- [ ] No hay errores en los logs

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs de deployment en Vercel
2. Verifica las variables de entorno
3. Asegúrate que Supabase esté activo
4. Revisa este archivo para troubleshooting
