const cron = require('node-cron');
const pool = require('../config/database');

// =============================================
// HEALTH CHECK - Se ejecuta cada minuto
// =============================================
cron.schedule('* * * * *', async () => {
  console.log('🔍 Ejecutando Health Check automático...');

  try {
    // Obtener todas las conexiones activas
    const connections = await pool.query(`
      SELECT * FROM connections WHERE status = 'ACTIVE'
    `);

    for (const conn of connections.rows) {
      // Simular métricas reales de cada motor
      const cpu = Math.random() * 100;
      const memory = Math.random() * 100;
      const activeConnections = Math.floor(Math.random() * 200);
      const locks = Math.floor(Math.random() * 20);
      const deadlocks = Math.random() < 0.05 ? Math.floor(Math.random() * 5) : 0;
      const disk_usage = Math.random() * 100;

      // Insertar métricas capturadas
      await pool.query(`
        INSERT INTO db_metrics 
          (db_id, cpu, memory, connections, locks, deadlocks, disk_usage)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [conn.id, cpu.toFixed(2), memory.toFixed(2),
          activeConnections, locks, deadlocks, disk_usage.toFixed(2)]);

      // Determinar estado de salud
      let health = 'Healthy';
      if (cpu > 85 || memory > 85 || disk_usage > 90) health = 'Critical';
      else if (cpu > 70 || memory > 70 || disk_usage > 75) health = 'Warning';

      // Actualizar status de la conexion
      let newStatus = 'ACTIVE';
      if (health === 'Critical') newStatus = 'ERROR';

      await pool.query(`
        UPDATE connections SET status = $1 WHERE id = $2
      `, [newStatus, conn.id]);

      console.log(`[${conn.nombre}] CPU: ${cpu.toFixed(1)}% | RAM: ${memory.toFixed(1)}% | Estado: ${health}`);
    }

  } catch (err) {
    console.error('Error en Health Check:', err.message);
  }
});

console.log('Health Check programado — ejecuta cada minuto');