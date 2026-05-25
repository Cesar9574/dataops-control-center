const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Obtener metricas de todas las bases de datos
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        c.nombre,
        c.motor,
        c.host,
        CASE 
          WHEN m.cpu > 85 OR m.memory > 85 OR m.disk_usage > 90 THEN 'Critical'
          WHEN m.cpu > 70 OR m.memory > 70 OR m.disk_usage > 75 THEN 'Warning'
          ELSE 'Healthy'
        END as health_status
      FROM db_metrics m
      JOIN connections c ON m.db_id = c.id
      WHERE m.capture_time = (
        SELECT MAX(capture_time) FROM db_metrics WHERE db_id = m.db_id
      )
      ORDER BY m.capture_time DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo métricas', message: err.message });
  }
});

/**
 * @swagger
 * /api/metrics/{id}/history:
 *   get:
 *     summary: Historial de metricas de una conexion
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/history', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 60 } = req.query;

    const result = await pool.query(`
      SELECT * FROM db_metrics 
      WHERE db_id = $1 
      ORDER BY capture_time DESC 
      LIMIT $2
    `, [id, limit]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo historial', message: err.message });
  }
});

/**
 * @swagger
 * /api/metrics/{id}/status:
 *   get:
 *     summary: Estado de salud de una conexion
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        m.*,
        c.nombre,
        c.motor,
        CASE 
          WHEN m.cpu > 85 OR m.memory > 85 OR m.disk_usage > 90 THEN 'Critical'
          WHEN m.cpu > 70 OR m.memory > 70 OR m.disk_usage > 75 THEN 'Warning'
          ELSE 'Healthy'
        END as health_status
      FROM db_metrics m
      JOIN connections c ON m.db_id = c.id
      WHERE m.db_id = $1
      ORDER BY m.capture_time DESC
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay métricas para esta conexión' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estado', message: err.message });
  }
});

/**
 * @swagger
 * /api/metrics/summary/all:
 *   get:
 *     summary: Resumen global de salud de todas las bases
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/summary/all', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE health_status = 'Healthy') as healthy,
        COUNT(*) FILTER (WHERE health_status = 'Warning') as warning,
        COUNT(*) FILTER (WHERE health_status = 'Critical') as critical,
        COUNT(*) as total
      FROM (
        SELECT 
          CASE 
            WHEN m.cpu > 85 OR m.memory > 85 OR m.disk_usage > 90 THEN 'Critical'
            WHEN m.cpu > 70 OR m.memory > 70 OR m.disk_usage > 75 THEN 'Warning'
            ELSE 'Healthy'
          END as health_status
        FROM db_metrics m
        WHERE m.capture_time = (
          SELECT MAX(capture_time) FROM db_metrics WHERE db_id = m.db_id
        )
      ) subquery
    `);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo resumen', message: err.message });
  }
});

module.exports = router;