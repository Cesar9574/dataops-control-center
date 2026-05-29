# DataOps Control Center
Plataforma centralizada de monitoreo, gestión y recuperación de bases de datos empresariales.

## Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Git

## Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/Cesar9574/dataops-control-center.git
cd dataops-control-center

# 2. Levantar toda la plataforma con un solo comando
docker compose up --build
```

Esperar 2-3 minutos mientras se descargan las imágenes y se inicializa la base de datos.

## URLs de acceso

| Servicio | URL | Credenciales |
|---|---|---|
| Dashboard React | http://localhost:3000 | admin / admin123 |
| API REST + Swagger | http://localhost:4000/api-docs | — |
| Grafana | http://localhost:3001 | admin / admin123 |
| Prometheus | http://localhost:9090 | — |

## Módulos implementados

1. **Registro de Motores** — Registro seguro de conexiones con bcrypt
2. **Health Check Automático** — Monitoreo cada minuto con estados Healthy/Warning/Critical
3. **Slow Query Analyzer** — Clasificación Fast/Medium/Slow/Critical de consultas
4. **Concurrencia** — Simulación de 100 usuarios con detección de deadlocks
5. **Backup, Recovery y Replicación** — FULL, DIFF, INC + Snapshots + AWS S3
6. **Replicación Distribuida** — Primario-Réplica con análisis del Teorema CAP
7. **Caché con Redis** — Hit/Miss con mejora de 10x en tiempos de respuesta
8. **Business Intelligence** — Dashboard con KPIs en tiempo real
9. **Motor de Alertas** — Reglas configurables sin redeploy

## Stack tecnológico

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + JWT
- **Base de datos:** PostgreSQL 15
- **Caché:** Redis 7
- **Monitoreo:** Prometheus + Grafana
- **Infraestructura:** Docker + Docker Compose

## Detener la plataforma

```bash
docker compose down
```