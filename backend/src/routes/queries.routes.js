const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/queries:
 *   get:
 *     summary: Obtener todas las queries registradas
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { classification, db_id, limit = 50 } = req.query;

    let query = `
      SELECT 
        q.*,
        c.nombre as db_nombre,
        c.motor
      FROM query_log q
      JOIN connections c ON q.db_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (classification) {
      params.push(classification);
      query += ` AND q.classification = $${params.length}`;
    }

    if (db_id) {
      params.push(db_id);
      query += ` AND q.db_id = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY q.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo queries', message: err.message });
  }
});

/**
 * @swagger
 * /api/queries/top-slow:
 *   get:
 *     summary: Top 10 consultas mas lentas
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 */
router.get('/top-slow', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        q.id,
        q.query_text,
        q.duration_ms,
        q.rows_returned,
        q.index_used,
        q.classification,
        q.execution_plan,
        q.created_at,
        c.nombre as db_nombre,
        c.motor
      FROM query_log q
      JOIN connections c ON q.db_id = c.id
      ORDER BY q.duration_ms DESC
      LIMIT 10
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo top queries', message: err.message });
  }
});

/**
 * @swagger
 * /api/queries/stats:
 *   get:
 *     summary: Estadisticas de clasificacion de queries
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        classification,
        COUNT(*) as total,
        AVG(duration_ms) as avg_duration,
        MAX(duration_ms) as max_duration,
        MIN(duration_ms) as min_duration
      FROM query_log
      GROUP BY classification
      ORDER BY 
        CASE classification
          WHEN 'Critical' THEN 1
          WHEN 'Slow' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Fast' THEN 4
        END
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estadísticas', message: err.message });
  }
});

/**
 * @swagger
 * /api/queries/simulate:
 *   post:
 *     summary: Simular y registrar una query con su duracion
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 */
router.post('/simulate', verifyToken, async (req, res) => {
  try {
    const { db_id, query_text, duration_ms, rows_returned, index_used } = req.body;

    if (!db_id || !query_text || !duration_ms) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'db_id, query_text y duration_ms son requeridos'
      });
    }

    // Clasificar automaticamente segun duracion
    let classification;
    if (duration_ms < 100) classification = 'Fast';
    else if (duration_ms < 500) classification = 'Medium';
    else if (duration_ms < 2000) classification = 'Slow';
    else classification = 'Critical';

    // Plan de ejecucion simulado
    const execution_plan = JSON.stringify({
      type: index_used ? 'Index Scan' : 'Sequential Scan',
      index: index_used || null,
      cost: duration_ms * 0.1,
      rows: rows_returned || 0
    });

    const result = await pool.query(`
      INSERT INTO query_log 
        (db_id, query_text, duration_ms, rows_returned, index_used, execution_plan, classification)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [db_id, query_text, duration_ms, rows_returned || 0, index_used || null, execution_plan, classification]);

    res.status(201).json({
      success: true,
      message: `Query clasificada como ${classification}`,
      data: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: 'Error simulando query', message: err.message });
  }
});

/**
 * @swagger
 * /api/queries/concurrency/simulate:
 *   post:
 *     summary: Simular concurrencia con multiples usuarios (Modulo 4)
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 */
router.post('/concurrency/simulate', verifyToken, async (req, res) => {
  try {
    const { db_id, users = 100 } = req.body;

    const operations = ['INSERT', 'UPDATE', 'DELETE', 'SELECT'];
    const lockTypes = ['SHARED', 'EXCLUSIVE', 'DEADLOCK', 'TIMEOUT'];
    const results = [];

    for (let i = 0; i < users; i++) {
      const operacion = operations[Math.floor(Math.random() * operations.length)];
      const inicio = new Date();
      const wait_time = Math.floor(Math.random() * 500);
      const fin = new Date(inicio.getTime() + wait_time);

      // Simular deadlock en algunos casos
      let lock_type;
      if (Math.random() < 0.05) lock_type = 'DEADLOCK';
      else if (Math.random() < 0.1) lock_type = 'TIMEOUT';
      else if (operacion === 'SELECT') lock_type = 'SHARED';
      else lock_type = 'EXCLUSIVE';

      const result = await pool.query(`
        INSERT INTO tx_log (db_id, session, operacion, inicio, fin, wait_time, lock_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [db_id || 1, `session_${i + 1}`, operacion, inicio, fin, wait_time, lock_type]);

      results.push(result.rows[0]);
    }

    // Contar deadlocks detectados
    const deadlocks = results.filter(r => r.lock_type === 'DEADLOCK').length;
    const timeouts = results.filter(r => r.lock_type === 'TIMEOUT').length;

    res.json({
      success: true,
      message: `Simulacion de ${users} usuarios completada`,
      summary: {
        total_transactions: users,
        deadlocks_detected: deadlocks,
        timeouts: timeouts,
        resolved: deadlocks > 0 ? 'Deadlocks resueltos automaticamente por rollback' : 'Sin deadlocks'
      },
      data: results.slice(0, 10)
    });

  } catch (err) {
    res.status(500).json({ error: 'Error simulando concurrencia', message: err.message });
  }
});

/**
 * @swagger
 * /api/queries/concurrency/logs:
 *   get:
 *     summary: Obtener logs de transacciones concurrentes
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 */
router.get('/concurrency/logs', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        c.nombre as db_nombre
      FROM tx_log t
      JOIN connections c ON t.db_id = c.id
      ORDER BY t.inicio DESC
      LIMIT 100
    `);

    const deadlocks = await pool.query(`
      SELECT COUNT(*) as total FROM tx_log WHERE lock_type = 'DEADLOCK'
    `);

    res.json({
      success: true,
      deadlocks_total: deadlocks.rows[0].total,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo logs', message: err.message });
  }
});

module.exports = router;