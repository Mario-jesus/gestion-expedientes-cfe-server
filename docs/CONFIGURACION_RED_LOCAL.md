# Configuración para Red Local

Esta guía explica cómo configurar el backend y frontend para que funcionen en una red local, permitiendo que otros dispositivos en la misma red puedan acceder a la aplicación.

## 📋 Requisitos Previos

1. El servidor backend debe estar ejecutándose en una máquina accesible desde la red local
2. Todos los dispositivos deben estar en la misma red (mismo router/WiFi)
3. Conocer la IP local de la máquina donde corre el servidor

## 🔧 Configuración del Backend

### 1. Obtener la IP de tu máquina en la red local

**Linux/WSL:**
```bash
hostname -I
# O
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig
# Buscar "IPv4 Address" en la sección de tu adaptador de red
```

**macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Ejemplo de IP: `192.168.1.100`

### 2. Configurar variables de entorno

Crea o actualiza tu archivo `.env` en la raíz del proyecto:

```env
# Host del servidor (0.0.0.0 permite conexiones desde cualquier interfaz de red)
SERVER_HOST=0.0.0.0

# Puerto del servidor
PORT=4000

# URL base del servidor (usar la IP de tu máquina para acceso desde red local)
# Reemplaza 192.168.1.100 con la IP de tu máquina
SERVER_BASE_URL=http://192.168.1.100

# Configuración de CORS
# Opción 1: Permitir todos los orígenes (solo para desarrollo/red local)
CORS_ALLOW_ALL=true

# Opción 2: Especificar orígenes permitidos (más seguro)
# CORS_ALLOW_ALL=false
# CORS_ORIGIN=http://localhost:5174,http://192.168.1.100:5174,http://192.168.1.101:5174
```

### 3. Configuración de PM2

El archivo `ecosystem.config.js` ya está configurado con:
- `SERVER_HOST=0.0.0.0` para permitir conexiones desde la red local
- `CORS_ALLOW_ALL=true` para permitir conexiones desde cualquier origen

Si necesitas personalizar, edita `ecosystem.config.js`:

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 4000,
  SERVER_HOST: '0.0.0.0',
  SERVER_BASE_URL: 'http://192.168.1.100', // Tu IP local
  CORS_ALLOW_ALL: 'true',
}
```

### 4. Iniciar el servidor con PM2

```bash
# Compilar el proyecto
npm run build

# Iniciar con PM2
npm run pm2:start

# Verificar que está corriendo
npm run pm2:status

# Ver logs
npm run pm2:logs
```

### 5. Verificar que el servidor está accesible

Desde otro dispositivo en la misma red, prueba acceder a:
```
http://192.168.1.100:4000/health
```

Deberías recibir una respuesta JSON con el estado del servidor.

## 🎨 Configuración del Frontend

### 1. Obtener la IP del servidor backend

Usa la misma IP que configuraste en `SERVER_BASE_URL` del backend.

### 2. Configurar la URL del API

**Opción A: Variable de entorno (Recomendado)**

Crea un archivo `.env` o `.env.local` en la raíz del proyecto frontend:

```env
# URL base del API (ajusta según tu backend)
# Para desarrollo local:
VITE_API_BASE_URL=http://localhost:4000

# Para acceso desde red local (reemplaza con la IP de tu servidor):
# VITE_API_BASE_URL=http://192.168.1.100:4000
```

**Opción B: Configuración en código**

Si tu frontend tiene un archivo de configuración (ej: `config.ts`, `config.js`):

```typescript
// config.ts
export const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
```

### 3. Ejemplo de uso en el frontend

```typescript
// api/client.ts
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 4. Iniciar el frontend

```bash
# Desarrollo
npm run dev

# O si necesitas especificar el host
npm run dev -- --host 0.0.0.0
```

## 🔒 Consideraciones de Seguridad

### Para Desarrollo/Red Local

- ✅ Usar `CORS_ALLOW_ALL=true` está bien para desarrollo
- ✅ Usar `SERVER_HOST=0.0.0.0` permite acceso desde la red local
- ⚠️ No usar estas configuraciones en producción pública

### Para Producción

- ❌ NO usar `CORS_ALLOW_ALL=true` en producción
- ✅ Especificar `CORS_ORIGIN` con los dominios exactos permitidos
- ✅ Considerar usar `SERVER_HOST=localhost` o una IP específica
- ✅ Usar HTTPS en producción
- ✅ Configurar firewall para limitar acceso

## 🐛 Solución de Problemas

### El servidor no es accesible desde otros dispositivos

1. **Verificar firewall:**
   ```bash
   # Linux
   sudo ufw allow 4000/tcp
   
   # O deshabilitar temporalmente para pruebas
   sudo ufw disable
   ```

2. **Verificar que el servidor está escuchando en 0.0.0.0:**
   ```bash
   netstat -tuln | grep 4000
   # Debe mostrar 0.0.0.0:4000, no 127.0.0.1:4000
   ```

3. **Verificar que la IP es correcta:**
   - Asegúrate de usar la IP de la interfaz de red correcta (WiFi o Ethernet)
   - La IP puede cambiar si te conectas a otra red

### Error de CORS en el navegador

1. **Verificar configuración de CORS:**
   - Asegúrate de que `CORS_ALLOW_ALL=true` o que tu IP está en `CORS_ORIGIN`
   - Reinicia el servidor después de cambiar variables de entorno

2. **Verificar que el frontend está usando la IP correcta:**
   - No uses `localhost` en el frontend si accedes desde otro dispositivo
   - Usa la IP del servidor: `http://192.168.1.100:4000`
   - Asegúrate de que `VITE_API_BASE_URL` apunta a la IP correcta del servidor

### El frontend no puede conectar al backend

1. **Verificar conectividad:**
   ```bash
   # Desde el dispositivo del frontend
   ping 192.168.1.100
   curl http://192.168.1.100:4000/health
   ```

2. **Verificar que el servidor está corriendo:**
   ```bash
   npm run pm2:status
   ```

3. **Verificar logs:**
   ```bash
   npm run pm2:logs
   ```

## 📝 Resumen de Variables de Entorno

### Backend (.env)

```env
SERVER_HOST=0.0.0.0
PORT=4000
SERVER_BASE_URL=http://192.168.1.100
CORS_ALLOW_ALL=true
```

### Frontend (.env)

```env
# Para desarrollo local
VITE_API_BASE_URL=http://localhost:4000

# Para acceso desde red local (reemplaza con la IP de tu servidor)
# VITE_API_BASE_URL=http://192.168.1.100:4000
```

## 🔄 Actualizar IP cuando cambia la red

Si te conectas a otra red WiFi, la IP de tu máquina puede cambiar. Debes:

1. Obtener la nueva IP
2. Actualizar `SERVER_BASE_URL` en el backend
3. Actualizar `VITE_API_BASE_URL` en el frontend con la nueva IP
4. Reiniciar ambos servicios

## 📚 Referencias

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [Express.js - app.listen()](https://expressjs.com/en/api.html#app.listen)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
