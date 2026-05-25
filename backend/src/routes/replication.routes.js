const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/replication/status:
 *   get:
 *     summary: Obtener estado actual de replicacion
 *     tags: [Replication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM replication_status
      ORDER BY capture_time DESC
      LIMIT 10
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo replicación', message: err.message });
  }
});

/**
 * @swagger
 * /api/replication/simulate:
 *   post:
 *     summary: Simular escenario de replicacion con lag
 *     tags: [Replication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/simulate', verifyToken, async (req, res) => {
  try {
    const { scenario } = req.body;

    // Escenarios definidos en el documento
    const scenarios = {
      normal: { lag: 2, estado: 'Aceptable' },
      medium: { lag: 5, estado: 'Advertencia' },
      high:   { lag: 20, estado: 'Critico' }
    };

    if (!scenarios[scenario]) {
      return res.status(400).json({
        error: 'Escenario inválido',
        message: 'scenario debe ser normal, medium o high'
      });
    }

    const { lag, estado } = scenarios[scenario];

    const result = await pool.query(`
      INSERT INTO replication_status 
        (primary_host, replica_host, lag_seconds, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, ['primary-db:5432', 'replica-db:5432', lag, estado]);

    res.status(201).json({
      success: true,
      message: `Escenario ${scenario} simulado`,
      data: result.rows[0],
      cap_analysis: {
        consistency: 'Eventual - La réplica puede tener datos desactualizados',
        availability: 'Alta - Sistema sigue operando durante lag',
        partition_tolerance: 'Tolerante - Réplica sigue aceptando lecturas',
        theorem: 'Este sistema prioriza AP sobre C (teorema CAP)'
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Error simulando replicación', message: err.message });
  }
});

/**
 * @swagger
 * /api/replication/cap-analysis:
 *   get:
 *     summary: Analisis del Teorema CAP de la arquitectura
 *     tags: [Replication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/cap-analysis', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      cap_theorem: {
        title: 'Análisis Teorema CAP — DataOps Control Center',
        architecture: 'Primario-Réplica (Primary-Replica)',
        properties: {
          consistency: {
            level: 'Eventual',
            description: 'La réplica puede tener un lag de hasta 20 segundos en carga alta. No garantiza lectura inmediata de datos recién escritos.',
            tradeoff: 'Se sacrifica consistencia fuerte por disponibilidad'
          },
          availability: {
            level: 'Alta',
            description: 'El sistema primario acepta escrituras y la réplica acepta lecturas incluso durante particiones de red.',
            tradeoff: 'Sistema siempre disponible para operaciones de lectura'
          },
          partition_tolerance: {
            level: 'Tolerante',
            description: 'Si el primario falla, la réplica puede ser promovida a primario (failover manual o automático).',
            tradeoff: 'Requiere intervención para failover completo'
          }
        },
        classification: 'Sistema AP (Availability + Partition Tolerance)',
        justification: 'En entornos de alta disponibilidad empresarial, se prioriza que el sistema esté siempre disponible sobre garantizar consistencia inmediata. El lag de replicación es aceptable para operaciones de lectura analítica.',
        lag_scenarios: [
          { scenario: 'Carga normal', lag: '2 seg', estado: 'Aceptable', impacto: 'Mínimo' },
          { scenario: 'Carga media',  lag: '5 seg', estado: 'Advertencia', impacto: 'Moderado' },
          { scenario: 'Carga alta',   lag: '20 seg', estado: 'Crítico', impacto: 'Alto' }
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en análisis CAP', message: err.message });
  }
});

/**
 * @swagger
 * /api/replication/history:
 *   get:
 *     summary: Historial de lag de replicacion
 *     tags: [Replication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM replication_status
      ORDER BY capture_time DESC
      LIMIT 100
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo historial', message: err.message });
  }
});

module.exports = router;