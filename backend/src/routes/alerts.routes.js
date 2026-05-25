const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Obtener todas las alertas registradas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { estado, severidad, limit = 50 } = req.query;

    let query = `
      SELECT 
        a.*,
        c.nombre as db_nombre,
        c.motor
      FROM alert_log a
      LEFT JOIN connections c ON a.db_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      params.push(estado);
      query += ` AND a.estado = $${params.length}`;
    }

    if (severidad) {
      params.push(severidad);
      query += ` AND a.severidad = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY a.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo alertas', message: err.message });
  }
});

/**
 * @swagger
 * /api/alerts/rules:
 *   get:
 *     summary: Obtener reglas de alertas configuradas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/rules', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM alert_rules ORDER BY severidad DESC, created_at ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo reglas', message: err.message });
  }
});

/**
 * @swagger
 * /api/alerts/rules:
 *   post:
 *     summary: Crear nueva regla de alerta
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.post('/rules', verifyToken, async (req, res) => {
  try {
    const { nombre, condicion, umbral, severidad, accion } = req.body;

    if (!nombre || !condicion || !umbral || !severidad || !accion) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Todos los campos son requeridos'
      });
    }

    const result = await pool.query(`
      INSERT INTO alert_rules (nombre, condicion, umbral, severidad, accion)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [nombre, condicion, umbral, severidad, accion]);

    res.status(201).json({
      success: true,
      message: 'Regla creada exitosamente',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creando regla', message: err.message });
  }
});

/**
 * @swagger
 * /api/alerts/rules/{id}:
 *   put:
 *     summary: Actualizar regla de alerta sin redeployar
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.put('/rules/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, condicion, umbral, severidad, accion, activa } = req.body;

    const result = await pool.query(`
      UPDATE alert_rules 
      SET nombre = COALESCE($1, nombre),
          condicion = COALESCE($2, condicion),
          umbral = COALESCE($3, umbral),
          severidad = COALESCE($4, severidad),
          accion = COALESCE($5, accion),
          activa = COALESCE($6, activa)
      WHERE id = $7
      RETURNING *
    `, [nombre, condicion, umbral, severidad, accion, activa, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Regla no encontrada' });
    }

    res.json({
      success: true,
      message: 'Regla actualizada sin necesidad de redeploy',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando regla', message: err.message });
  }
});

/**
 * @swagger
 * /api/alerts/{id}/resolve:
 *   put:
 *     summary: Marcar alerta como resuelta
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/resolve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE alert_log 
      SET estado = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    res.json({
      success: true,
      message: 'Alerta resuelta',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error resolviendo alerta', message: err.message });
  }
});

/**
 * @swagger
 * /api/alerts/summary:
 *   get:
 *     summary: Resumen de alertas activas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE estado = 'OPEN') as abiertas,
        COUNT(*) FILTER (WHERE estado = 'RESOLVED') as resueltas,
        COUNT(*) FILTER (WHERE severidad = 'Critical' AND estado = 'OPEN') as criticas_abiertas,
        COUNT(*) FILTER (WHERE severidad = 'Warning' AND estado = 'OPEN') as warnings_abiertos,
        COUNT(*) as total
      FROM alert_log
    `);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo resumen', message: err.message });
  }
});

module.exports = router;