const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// =============================================
// MIDDLEWARES
// =============================================
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// SWAGGER - Documentacion API
// =============================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DataOps Control Center API',
      version: '1.0.0',
      description: 'API para monitoreo inteligente de bases de datos empresariales',
    },
    servers: [{ url: 'http://localhost:4000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// =============================================
// RUTAS
// =============================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/connections', require('./routes/connections.routes'));
app.use('/api/metrics', require('./routes/metrics.routes'));
app.use('/api/queries', require('./routes/queries.routes'));
app.use('/api/backups', require('./routes/backups.routes'));
app.use('/api/alerts', require('./routes/alerts.routes'));
app.use('/api/replication', require('./routes/replication.routes'));
app.use('/api/cache', require('./routes/cache.routes'));

// =============================================
// RUTA DE SALUD
// =============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'DataOps Control Center API corriendo',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// =============================================
// METRICAS PROMETHEUS
// =============================================
const client = require('prom-client');
client.collectDefaultMetrics();
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// =============================================
// JOBS PLANIFICADOS
// =============================================
require('./services/healthcheck.service');
require('./services/alerts.service');

// =============================================
// MANEJO DE ERRORES
// =============================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`DataOps API corriendo en http://localhost:${PORT}`);
  console.log(`Swagger docs en http://localhost:${PORT}/api-docs`);
  console.log(`Metricas Prometheus en http://localhost:${PORT}/metrics`);
});

module.exports = app;