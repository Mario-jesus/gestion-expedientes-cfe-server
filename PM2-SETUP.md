# Configuración de PM2 para Windows

Esta guía te ayudará a configurar PM2 para que el servidor se ejecute automáticamente en Windows y se reinicie en cada nueva sesión.

## 📋 Requisitos Previos

1. **Node.js** instalado (versión 18 o superior)
2. **npm** instalado
3. **Proyecto compilado** (ejecutar `npm run build` antes de usar PM2)

## 🚀 Instalación de PM2

Abre PowerShell o CMD **como administrador** y ejecuta:

```bash
npm install -g pm2
```

Verifica la instalación:

```bash
pm2 --version
```

## ⚙️ Configuración Inicial

### Paso 1: Compilar el proyecto

Antes de usar PM2, asegúrate de que el proyecto esté compilado:

```bash
npm run build
```

### Paso 2: Iniciar la aplicación con PM2

```bash
npm run pm2:start
```

Esto iniciará el servidor usando la configuración de `ecosystem.config.js`.

### Paso 3: Verificar que funciona

Verifica el estado:

```bash
npm run pm2:status
```

O abre tu navegador en: `http://localhost:4000/health`

### Paso 4: Guardar la configuración

Guarda la configuración actual de PM2 para que persista después de reiniciar:

```bash
npm run pm2:save
```

### Paso 5: Configurar inicio automático en Windows

Ejecuta este comando para configurar el inicio automático:

```bash
npm run pm2:startup
```

PM2 mostrará un comando que debes ejecutar. Cópialo y ejecútalo en PowerShell **como administrador**.

El comando será algo como:

```bash
pm2 startup
```

Después de ejecutar el comando de startup, ejecuta nuevamente:

```bash
npm run pm2:save
```

## 📝 Comandos Disponibles

### Gestión de la aplicación

```bash
# Iniciar la aplicación
npm run pm2:start

# Detener la aplicación
npm run pm2:stop

# Reiniciar la aplicación
npm run pm2:restart

# Eliminar la aplicación de PM2
npm run pm2:delete

# Ver estado de todas las aplicaciones
npm run pm2:status
```

### Monitoreo y logs

```bash
# Ver logs en tiempo real
npm run pm2:logs

# Ver monitoreo interactivo
npm run pm2:monit

# Ver información detallada de la aplicación
pm2 show gestion-expedientes-cfe-server
```

### Gestión de configuración

```bash
# Guardar la configuración actual
npm run pm2:save

# Restaurar la configuración guardada
npm run pm2:resurrect

# Configurar inicio automático
npm run pm2:startup
```

## 🔍 Verificación del Inicio Automático

1. **Reinicia tu PC con Windows**
2. **Inicia sesión** en tu cuenta de usuario
3. **Verifica que el servidor esté corriendo:**

```bash
npm run pm2:status
```

O abre tu navegador en: `http://localhost:4000/health`

## 🛠️ Solución de Problemas

### El servidor no inicia automáticamente

1. **Verifica la tarea programada:**
   - Abre "Programador de tareas" en Windows
   - Busca una tarea relacionada con PM2
   - Verifica que esté habilitada

2. **Reconfigura el startup:**
   ```bash
   pm2 unstartup
   npm run pm2:startup
   npm run pm2:save
   ```

3. **Verifica los logs:**
   ```bash
   npm run pm2:logs
   ```

### El servidor no compila correctamente

Asegúrate de compilar el proyecto antes de iniciar con PM2:

```bash
npm run build
```

### Problemas con variables de entorno

PM2 usará las variables del archivo `.env` si está configurado. Asegúrate de:

1. Tener el archivo `.env` en la raíz del proyecto
2. Que todas las variables necesarias estén configuradas
3. Verificar que el archivo `.env` no esté en `.gitignore` (solo `.env` está ignorado, no `.env.example`)

### Ver logs de errores

Los logs de PM2 se guardan en:
- `./logs/pm2-error.log` - Errores
- `./logs/pm2-out.log` - Salida estándar
- `./logs/pm2-combined.log` - Logs combinados

También puedes verlos en tiempo real:

```bash
npm run pm2:logs
```

## 📁 Archivos de Configuración

- **`ecosystem.config.js`**: Configuración principal de PM2
  - Define el nombre de la aplicación
  - Configura el script a ejecutar (`./dist/server.js`)
  - Establece variables de entorno
  - Configura logs y reinicios automáticos

## ⚠️ Notas Importantes

1. **Variables de entorno**: PM2 usará las variables del archivo `.env` si está configurado. Asegúrate de tener el `.env` en la raíz del proyecto.

2. **Ruta de logs**: Los logs se guardan en `./logs/`. Esta carpeta se crea automáticamente si no existe.

3. **Permisos**: Si tienes problemas, ejecuta PowerShell como administrador.

4. **Inicio automático**: En Windows, PM2 crea una tarea programada que se ejecuta al iniciar sesión del usuario (no al iniciar el sistema).

5. **Compilación**: Recuerda ejecutar `npm run build` después de hacer cambios en el código antes de reiniciar PM2.

## 🔄 Flujo de Trabajo Recomendado

1. **Desarrollo:**
   ```bash
   npm run dev  # Usa nodemon para desarrollo
   ```

2. **Producción/PM2:**
   ```bash
   npm run build        # Compilar
   npm run pm2:restart  # Reiniciar con PM2
   ```

3. **Después de cambios:**
   ```bash
   npm run build
   npm run pm2:restart
   ```

## 📚 Referencias

- [Documentación oficial de PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 en Windows](https://pm2.keymetrics.io/docs/usage/startup/)
