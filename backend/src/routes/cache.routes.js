const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const redisClient = require('../config/redis');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Estadisticas de cache Redis
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE cache_hit = true) as hits,
        COUNT(*) FILTER (WHERE cache_hit = false) as misses,
        ROUND(
          COUNT(*) FILTER (WHERE cache_hit = true) * 100.0 / NULLIF(COUNT(*), 0), 2
        ) as hit_ratio,
        AVG(duration_ms) FILTER (WHERE cache_hit = true) as avg_duration_hit,
        AVG(duration_ms) FILTER (WHERE cache_hit = false) as avg_duration_miss
      FROM cache_metrics
    `);

    res.json({
      success: true,
      data: result.rows[0],
      benchmark: {
        sin_cache: '~400 ms por consulta',
        con_cache: '~40 ms por consulta',
        mejora: '10x mas rapido'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo stats', message: err.message });
  }
});

/**
 * @swagger
 * /api/cache/simulate:
 *   post:
 *     summary: Simular consulta con y sin cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 */
router.post('/simulate', verifyToken, async (req, res) => {
  try {
    const { query_key, use_cache = true } = req.body;

    if (!query_key) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'query_key es requerido'
      });
    }

    let cache_hit = false;
    let duration_ms = 0;
    let data = null;

    if (use_cache) {
      // Intentar obtener de Redis
      const cached = await redisClient.get(`query:${query_key}`);

      if (cached) {
        // CACHE HIT - respuesta rapida
        cache_hit = true;
        duration_ms = Math.floor(Math.random() * 30) + 10; // 10-40ms
        data = JSON.parse(cached);
      } else {
        // CACHE MISS - consulta a BD
        cache_hit = false;
        duration_ms = Math.floor(Math.random() * 200) + 300; // 300-500ms

        // Simular datos de BD
        data = {
          query_key,
          result: `Resultado simulado para ${query_key}`,
          timestamp: new Date().toISOString(),
          rows: Math.floor(Math.random() * 1000)
        };

        // Guardar en Redis con TTL de 5 minutos
        await redisClient.setEx(
          `query:${query_key}`,
          300,
          JSON.stringify(data)
        );
      }
    } else {
      // Sin cache - siempre consulta BD
      cache_hit = false;
      duration_ms = Math.floor(Math.random() * 200) + 300;
      data = {
        query_key,
        result: `Resultado simulado para ${query_key}`,
        timestamp: new Date().toISOString(),
        rows: Math.floor(Math.random() * 1000)
      };
    }

    // Registrar metrica
    await pool.query(`
      INSERT INTO cache_metrics (cache_hit, query_key, duration_ms)
      VALUES ($1, $2, $3)
    `, [cache_hit, query_key, duration_ms]);

    res.json({
      success: true,
      cache_hit,
      duration_ms,
      message: cache_hit ? '✅ Cache HIT - Datos obtenidos de Redis' : '❌ Cache MISS - Datos obtenidos de BD',
      data
    });

  } catch (err) {
    res.status(500).json({ error: 'Error simulando cache', message: err.message });
  }
});

/**
 * @swagger
 * /api/cache/invalidate:
 *   post:
 *     summary: Invalidar cache manualmente por evento
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 */
router.post('/invalidate', verifyToken, async (req, res) => {
  try {
    const { query_key } = req.body;

    if (!query_key) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'query_key es requerido'
      });
    }

    await redisClient.del(`query:${query_key}`);

    res.json({
      success: true,
      message: `Cache invalidado para key: ${query_key}`,
      strategy: 'Invalidación manual por evento'
    });
  } catch (err) {
    res.status(500).json({ error: 'Error invalidando cache', message: err.message });
  }
});

/**
 * @swagger
 * /api/cache/flush:
 *   post:
 *     summary: Limpiar todo el cache Redis
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 */
router.post('/flush', verifyToken, async (req, res) => {
  try {
    await redisClient.flushAll();

    res.json({
      success: true,
      message: 'Cache Redis limpiado completamente',
      strategy: 'Flush total — usar con precaución en producción'
    });
  } catch (err) {
    res.status(500).json({ error: 'Error limpiando cache', message: err.message });
  }
});

module.exports = router;