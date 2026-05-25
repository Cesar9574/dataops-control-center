const cron = require('node-cron');
const pool = require('../config/database');

// =============================================
// MOTOR DE ALERTAS - Se ejecuta cada 2 minutos
// =============================================
cron.schedule('*/2 * * * *', async () => {
  console.log('🚨 Evaluando reglas de alertas...');

  try {
    // Obtener reglas activas
    const rules = await pool.query(`
      SELECT * FROM alert_rules WHERE activa = true
    `);

    // Obtener ultimas metricas de cada BD
    const metrics = await pool.query(`
      SELECT DISTINCT ON (db_id)
        m.*,
        c.nombre as db_nombre,
        c.motor
      FROM db_metrics m
      JOIN connections c ON m.db_id = c.id
      ORDER BY db_id, capture_time DESC
    `);

    for (const metric of metrics.rows) {
      for (const rule of rules.rows) {
        let triggered = false;
        let valor_actual = 0;

        // Evaluar cada condicion
        if (rule.condicion.includes('cpu') && metric.cpu > rule.umbral) {
          triggered = true;
          valor_actual = metric.cpu;
        } else if (rule.condicion.includes('memory') && metric.memory > rule.umbral) {
          triggered = true;
          valor_actual = metric.memory;
        } else if (rule.condicion.includes('deadlocks') && metric.deadlocks > rule.umbral) {
          triggered = true;
          valor_actual = metric.deadlocks;
        } else if (rule.condicion.includes('disk_usage') && metric.disk_usage > rule.umbral) {
          triggered = true;
          valor_actual = metric.disk_usage;
        } else if (rule.condicion.includes('connections') && metric.connections > rule.umbral) {
          triggered = true;
          valor_actual = metric.connections;
        }

        if (triggered) {
          // Verificar si ya existe alerta abierta para esta condicion
          const existing = await pool.query(`
            SELECT id FROM alert_log
            WHERE db_id = $1 
            AND condicion = $2 
            AND estado = 'OPEN'
          `, [metric.db_id, rule.nombre]);

          if (existing.rows.length === 0) {
            // Registrar nueva alerta
            await pool.query(`
              INSERT INTO alert_log 
                (db_id, condicion, severidad, motor_afectado, estado, mensaje)
              VALUES ($1, $2, $3, $4, 'OPEN', $5)
            `, [
              metric.db_id,
              rule.nombre,
              rule.severidad,
              metric.db_nombre,
              `${rule.nombre}: valor actual ${valor_actual.toFixed(2)} supera umbral ${rule.umbral}`
            ]);

            console.log(`🚨 [${rule.severidad}] Alerta generada: ${rule.nombre} en ${metric.db_nombre}`);
          }
        }
      }
    }

    // Verificar backups fallidos
    const failedBackups = await pool.query(`
      SELECT b.*, c.nombre 
      FROM backup_history b
      JOIN connections c ON b.db_id = c.id
      WHERE b.status = 'FAILED'
      AND b.created_at > NOW() - INTERVAL '1 hour'
    `);

    for (const backup of failedBackups.rows) {
      const existing = await pool.query(`
        SELECT id FROM alert_log
        WHERE db_id = $1 
        AND condicion = 'Backup Fallido'
        AND estado = 'OPEN'
        AND created_at > NOW() - INTERVAL '1 hour'
      `, [backup.db_id]);

      if (existing.rows.length === 0) {
        await pool.query(`
          INSERT INTO alert_log 
            (db_id, condicion, severidad, motor_afectado, estado, mensaje)
          VALUES ($1, 'Backup Fallido', 'Critical', $2, 'OPEN', $3)
        `, [
          backup.db_id,
          backup.nombre,
          `Backup ${backup.tipo} falló en ${backup.nombre}`
        ]);

        console.log(`[Critical] Backup fallido detectado en ${backup.nombre}`);
      }
    }

  } catch (err) {
    console.error('Error evaluando alertas:', err.message);
  }
});

console.log('Motor de Alertas programado — evalúa cada 2 minutos');