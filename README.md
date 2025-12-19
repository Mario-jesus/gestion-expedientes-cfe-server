# Gestión de Expedientes CFE - Backend Server

Backend server para gestión de expedientes de colaboradores de CFE, desarrollado con Node.js, Express y TypeScript.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** (viene incluido con Node.js)
- **Git** (para clonar el repositorio)

Para verificar las versiones instaladas:

```bash
node --version
npm --version
git --version
```

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd gestion-expedientes-cfe-server
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias definidas en `package.json`.

## ⚙️ Configuración

### 1. Crear archivo de variables de entorno

Copia el archivo de ejemplo y crea tu propio `.env`:

```bash
cp .env.example .env
```

### 2. Configurar variables de entorno

Edita el archivo `.env` con tus configuraciones:

```env
# Puerto del servidor
PORT=3000

# Ambiente (development, production, test)
NODE_ENV=development
```

**Nota:** El archivo `.env` está en `.gitignore` y no se subirá al repositorio. Solo el archivo `.env.example` se mantiene como plantilla.

## 🏃 Ejecución

### Modo Desarrollo

Ejecuta el servidor en modo desarrollo con hot-reload (recarga automática al guardar cambios):

```bash
npm run dev
```

O usando el alias:

```bash
npm run start:dev
```

El servidor estará disponible en: `http://localhost:3000` (o el puerto configurado en `.env`)

### Modo Producción

1. **Compilar TypeScript a JavaScript:**

```bash
npm run build
```

Esto generará los archivos compilados en la carpeta `dist/`.

2. **Ejecutar el servidor:**

```bash
npm start
```

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Ejecuta el servidor en modo desarrollo con hot-reload |
| `npm run build` | Compila TypeScript a JavaScript en la carpeta `dist/` |
| `npm start` | Ejecuta el servidor en modo producción (requiere build previo) |
| `npm run start:dev` | Alias para `npm run dev` |

## 🧪 Verificar que funciona

Una vez que el servidor esté corriendo, puedes verificar que funciona correctamente:

### Health Check

```bash
curl http://localhost:3000/health
```

O abre en tu navegador: `http://localhost:3000/health`

Deberías ver una respuesta como:

```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-06-15T10:00:00.000Z"
}
```

### Ruta raíz

```bash
curl http://localhost:3000/
```

O abre en tu navegador: `http://localhost:3000/`

## 📁 Estructura del Proyecto

```
gestion-expedientes-cfe-server/
├── src/
│   ├── app.ts              # Configuración de Express (middlewares, rutas)
│   └── server.ts           # Entry point (arranca el servidor)
├── docs/                   # Documentación del proyecto
│   ├── REQUERIMIENTOS_FUNCIONALES.md
│   └── ANALISIS_ENDPOINTS_BACKEND.md
├── .env.example            # Plantilla de variables de entorno
├── .gitignore              # Archivos ignorados por Git
├── package.json            # Dependencias y scripts
├── tsconfig.json           # Configuración de TypeScript
└── README.md               # Este archivo
```

## 🔧 Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web para Node.js
- **TypeScript** - Superset de JavaScript con tipado estático
- **dotenv** - Manejo de variables de entorno
- **cors** - Middleware para habilitar CORS

## 🐛 Solución de Problemas

### El servidor no inicia

1. Verifica que el puerto no esté en uso:
```bash
# Linux/Mac
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

2. Verifica que las variables de entorno estén correctamente configuradas en `.env`

3. Asegúrate de que todas las dependencias estén instaladas:
```bash
npm install
```

### Errores de TypeScript

Si hay errores de compilación, verifica la configuración en `tsconfig.json` y asegúrate de tener TypeScript instalado:

```bash
npm install -g typescript
```
