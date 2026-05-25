const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Usuario admin hardcodeado para la demo
// En produccion esto vendria de una tabla users en BD
const ADMIN_USER = {
  id: 1,
  username: 'admin',
  // password: admin123
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  role: 'admin'
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesion en DataOps
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, retorna JWT
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Username y password son requeridos'
      });
    }

    if (username !== ADMIN_USER.username) {
      return res.status(401).json({
        error: 'Credenciales incorrectas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const validPassword = await bcrypt.compare(password, ADMIN_USER.password);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Credenciales incorrectas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      { id: ADMIN_USER.id, username: ADMIN_USER.username, role: ADMIN_USER.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: ADMIN_USER.id,
        username: ADMIN_USER.username,
        role: ADMIN_USER.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Error en login', message: err.message });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar token JWT
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valido
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false, message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(403).json({ valid: false, message: 'Token inválido' });
  }
});

module.exports = router;