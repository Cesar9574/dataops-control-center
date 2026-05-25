const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth.middleware');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * /api/connections:
 *   get:
 *     summary: Obtener todas las conexiones registradas
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conexiones
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre, motor, host, port, database_name, 
             user_name, status, created_at 
      FROM connections 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo conexiones', message: err.message });
  }
});

/**
 * @swagger
 * /api/connections:
 *   post:
 *     summary: Registrar nueva conexion de base de datos
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { nombre, motor, host, port, database_name, user_name, password } = req.body;

    if (!nombre || !motor || !host || !port || !database_name || !user_name || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Todos los campos son requeridos'
      });
    }

    if (!['Oracle', 'SQLServer', 'PostgreSQL'].includes(motor)) {
      return res.status(400).json({
        error: 'Motor inválido',
        message: 'Motor debe ser Oracle, SQLServer o PostgreSQL'
      });
    }

    // Encriptar password - NUNCA se guarda en texto plano
    const password_encrypted = await bcrypt.hash(password, 10);

    const result = await pool.query(`
      INSERT INTO connections (nombre, motor, host, port, database_name, user_name, password_encrypted, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
      RETURNING id, nombre, motor, host, port, database_name, user_name, status, created_at
    `, [nombre, motor, host, port, database_name, user_name, password_encrypted]);

    res.status(201).json({
      success: true,
      message: 'Conexión registrada exitosamente',
      data: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: 'Error registrando conexión', message: err.message });
  }
});

/**
 * @swagger
 * /api/connections/{id}:
 *   get:
 *     summary: Obtener conexion por ID
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT id, nombre, motor, host, port, database_name, 
             user_name, status, created_at 
      FROM connections WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conexión no encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo conexión', message: err.message });
  }
});

/**
 * @swagger
 * /api/connections/{id}/status:
 *   put:
 *     summary: Actualizar estado de una conexion
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'ERROR'].includes(status)) {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'Status debe ser ACTIVE, INACTIVE o ERROR'
      });
    }

    const result = await pool.query(`
      UPDATE connections SET status = $1 WHERE id = $2
      RETURNING id, nombre, motor, status
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conexión no encontrada' });
    }

    res.json({ success: true, message: 'Estado actualizado', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando estado', message: err.message });
  }
});

/**
 * @swagger
 * /api/connections/{id}:
 *   delete:
 *     summary: Eliminar una conexion
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM connections WHERE id = $1 RETURNING id, nombre',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conexión no encontrada' });
    }

    res.json({ success: true, message: 'Conexión eliminada', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando conexión', message: err.message });
  }
});

module.exports = router;