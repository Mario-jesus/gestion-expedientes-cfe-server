# Configuración de Infraestructura

Esta carpeta contiene archivos de configuración para servicios de infraestructura relacionados con el proyecto.

## Archivos

### `loki-config.yaml`
Configuración para el servidor Loki (agregación de logs).

**Uso:**
```bash
# Ejecutar Loki con esta configuración
loki -config.file=./config/loki-config.yaml
```

O con Docker:
```bash
docker run -d --name=loki -p 3100:3100 -v $(pwd)/config/loki-config.yaml:/etc/loki/local-config.yaml grafana/loki:latest -config.file=/etc/loki/local-config.yaml
```

## Notas

- Estos archivos son de configuración de infraestructura, no de la aplicación Node.js
- La aplicación Node.js se configura mediante variables de entorno (`.env`)
- Estos archivos se pueden versionar en Git (a diferencia de `.env`)

