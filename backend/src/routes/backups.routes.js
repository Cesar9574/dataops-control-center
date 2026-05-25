const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth.middleware');
const crypto = require('crypto');

/**
 * @swagger
 * /api/backups:
 *   get:
 *     summary: Obtener historial de backups
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.*,
        c.nombre as db_nombre,
        c.motor,
        CASE 
          WHEN b.rpo_minutes <= 15 AND b.rto_minutes <= 45 THEN 'SLA_CUMPLIDO'
          ELSE 'SLA_INCUMPLIDO'
        END as sla_status
      FROM backup_history b
      JOIN connections c ON b.db_id = c.id
      ORDER BY b.created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo backups', message: err.message });
  }
});

/**
 * @swagger
 * /api/backups/simulate:
 *   post:
 *     summary: Simular ejecucion de backup
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 */
router.post('/simulate', verifyToken, async (req, res) => {
  try {
    const { db_id, tipo } = req.body;

    if (!db_id || !tipo) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'db_id y tipo son requeridos'
      });
    }

    if (!['FULL', 'DIFF', 'INC'].includes(tipo)) {
      return res.status(400).json({
        error: 'Tipo inválido',
        message: 'tipo debe ser FULL, DIFF o INC'
      });
    }

    // Simular datos del backup
    const size_mb = tipo === 'FULL' 
      ? Math.floor(Math.random() * 5000) + 1000
      : tipo === 'DIFF'
      ? Math.floor(Math.random() * 1000) + 100
      : Math.floor(Math.random() * 200) + 50;

    const duration_seconds = tipo === 'FULL'
      ? Math.floor(Math.random() * 300) + 120
      : tipo === 'DIFF'
      ? Math.floor(Math.random() * 120) + 30
      : Math.floor(Math.random() * 60) + 10;

    // Hash MD5 simulado para verificacion de integridad
    const hash_md5 = crypto
      .createHash('md5')
      .update(`backup_${db_id}_${tipo}_${Date.now()}`)
      .digest('hex');

    const restore_point = `RP_${tipo}_${new Date().toISOString().replace(/[:.]/g, '_')}`;

    // Buscar parent backup si es DIFF o INC
    let parent_backup_id = null;
    if (tipo === 'DIFF' || tipo === 'INC') {
      const parent = await pool.query(`
        SELECT id FROM backup_history 
        WHERE db_id = $1 AND tipo = 'FULL' AND status = 'SUCCESS'
        ORDER BY created_at DESC LIMIT 1
      `, [db_id]);
      parent_backup_id = parent.rows[0]?.id || null;
    }

    // URL simulada en la nube
    const cloud_url = `https://dataops-backups.s3.amazonaws.com/${db_id}/${tipo}/${hash_md5}.bak`;

    const result = await pool.query(`
      INSERT INTO backup_history 
        (db_id, tipo, size_mb, duration_seconds, restore_point, 
         parent_backup_id, cloud_url, hash_md5, status, rpo_minutes, rto_minutes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SUCCESS', $9, $10)
      RETURNING *
    `, [
      db_id, tipo, size_mb, duration_seconds, restore_point,
      parent_backup_id, cloud_url, hash_md5,
      Math.floor(duration_seconds / 60) + 5,
      Math.floor(duration_seconds / 60) + 15
    ]);

    res.status(201).json({
      success: true,
      message: `Backup ${tipo} ejecutado y replicado a la nube exitosamente`,
      data: result.rows[0],
      cloud: {
        provider: 'AWS S3',
        url: cloud_url,
        integrity: hash_md5,
        verified: true
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Error simulando backup', message: err.message });
  }
});

/**
 * @swagger
 * /api/backups/snapshot:
 *   post:
 *     summary: Crear snapshot del entorno
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 */
router.post('/snapshot', verifyToken, async (req, res) => {
  try {
    const { db_id, snapshot_name } = req.body;

    const validSnapshots = ['PRE_DEPLOY', 'PRE_TEST', 'PRE_IMPORT'];
    if (!validSnapshots.includes(snapshot_name)) {
      return res.status(400).json({
        error: 'Snapshot inválido',
        message: 'snapshot_name debe ser PRE_DEPLOY, PRE_TEST o PRE_IMPORT'
      });
    }

    const hash_md5 = crypto
      .createHash('md5')
      .update(`snapshot_${db_id}_${snapshot_name}_${Date.now()}`)
      .digest('hex');

    const result = await pool.query(`
      INSERT INTO backup_history 
        (db_id, tipo, size_mb, duration_seconds, restore_point, 
         cloud_url, hash_md5, status, rpo_minutes, rto_minutes)
      VALUES ($1, 'FULL', $2, $3, $4, $5, $6, 'SUCCESS', 15, 45)
      RETURNING *
    `, [
      db_id || 1,
      Math.floor(Math.random() * 2000) + 500,
      Math.floor(Math.random() * 120) + 30,
      snapshot_name,
      `https://dataops-backups.s3.amazonaws.com/snapshots/${snapshot_name}_${hash_md5}.bak`,
      hash_md5
    ]);

    res.status(201).json({
      success: true,
      message: `Snapshot ${snapshot_name} creado exitosamente`,
      data: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: 'Error creando snapshot', message: err.message });
  }
});

/**
 * @swagger
 * /api/backups/restore/{id}:
 *   post:
 *     summary: Simular restauracion desde un backup
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 */
router.post('/restore/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const backup = await pool.query(
      'SELECT * FROM backup_history WHERE id = $1',
      [id]
    );

    if (backup.rows.length === 0) {
      return res.status(404).json({ error: 'Backup no encontrado' });
    }

    const b = backup.rows[0];
    const rto_actual = Math.floor(b.duration_seconds / 60) + 10;

    res.json({
      success: true,
      message: 'Restauracion completada exitosamente',
      restore_details: {
        backup_id: b.id,
        tipo: b.tipo,
        restore_point: b.restore_point,
        rpo_minutes: b.rpo_minutes,
        rto_minutes: rto_actual,
        sla_cumplido: b.rpo_minutes <= 15 && rto_actual <= 45,
        integrity_verified: true,
        hash_md5: b.hash_md5
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Error en restauracion', message: err.message });
  }
});

/**
 * @swagger
 * /api/backups/sla:
 *   get:
 *     summary: Reporte de cumplimiento de SLA
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/sla', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE status = 'SUCCESS') as exitosos,
        COUNT(*) FILTER (WHERE status = 'FAILED') as fallidos,
        COUNT(*) FILTER (WHERE rpo_minutes <= 15 AND rto_minutes <= 45) as sla_cumplido,
        COUNT(*) FILTER (WHERE rpo_minutes > 15 OR rto_minutes > 45) as sla_incumplido,
        AVG(rpo_minutes) as avg_rpo,
        AVG(rto_minutes) as avg_rto
      FROM backup_history
    `);

    res.json({
      success: true,
      sla_objetivo: { rpo_minutos: 15, rto_minutos: 45 },
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo SLA', message: err.message });
  }
});

module.exports = router;