# Tests - Base de Datos

## ¿Los tests modifican la DB?

**NO**, los tests NO deben modificar tu base de datos de producción/desarrollo.

## Estrategias para Tests

### 1. **InMemoryDatabase (Recomendado para tests unitarios/integración)**

Los tests usan `InMemoryDatabase` por defecto cuando:
- `NODE_ENV=test`
- `USE_MONGODB=false`

**Ventajas**:
- ✅ Muy rápido
- ✅ No requiere MongoDB corriendo
- ✅ Aislamiento completo
- ✅ Se limpia automáticamente

**Desventajas**:
- ⚠️ No prueba características específicas de MongoDB (índices, TTL, etc.)

### 2. **Base de Datos de Prueba Separada**

Para tests E2E más realistas, puedes usar una base de datos MongoDB separada:

```typescript
// En setup.ts o variables de entorno de test
process.env.DATABASE_NAME = 'gestion-expedientes-cfe-test';
```

**Ventajas**:
- ✅ Prueba comportamiento real de MongoDB
- ✅ Prueba índices, TTL, etc.

**Desventajas**:
- ⚠️ Requiere MongoDB corriendo
- ⚠️ Más lento
- ⚠️ Necesitas limpiar la DB después de cada test

## Configuración Actual

Por defecto, los tests usan `InMemoryDatabase` (configurado en `src/__tests__/setup.ts`).

Si necesitas usar MongoDB real en tests, cambia en `setup.ts`:
```typescript
process.env.USE_MONGODB = 'true';
process.env.DATABASE_NAME = 'gestion-expedientes-cfe-test';
```
