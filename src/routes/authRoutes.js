const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const path = require('path');
const db = require('../config/db');
const { verificarSesion } = require('../middlewares/authMiddleware');
const { verificarEstudiante } = require('../middlewares/authMiddleware');

// LOGIN VISTA
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});
// vista login estudiante
router.get('/login-estudiante', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login_estudiante.html'));
});

// LOGIN
router.post('/login', authController.login);
// login estudiante
router.post('/login-estudiante', authController.loginEstudiante);
// dashboard estudiante protegido
router.get('/dashboard-estudiante', verificarEstudiante, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard_estudiante.html'));
});

// LOGOUT
router.get('/logout', authController.logout);

// 🔒 PROTEGER DASHBOARD
router.get('/dashboard', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

// API SUPERVISOR (PROTEGIDA)
router.get('/api/supervisor', verificarSesion, (req, res) => {

    const id = req.session.supervisor.id_supervisor;

    db.query(
        'SELECT nombre, apellido, correo FROM supervisores WHERE id_supervisor = ?',
        [id],
        (err, results) => {
            if (err || results.length === 0) {
                console.error('Error BD:', err);
                return res.status(500).json({ error: 'Error al obtener supervisor' });
            }

            const s = results[0];

            res.json({
                nombre: `${s.nombre} ${s.apellido || ''}`.trim(),
                correo: s.correo || ''
            });
        }
    );
});

// Verificar si estudiante sigue activo en la BD
router.get('/api/auth/verificar-estudiante', (req, res) => {
    const correo = req.query.correo;

    if (!correo) {
        return res.status(400).json({ existe: false });
    }

    db.query(
        'SELECT id FROM estudiantes WHERE correo = ?',
        [correo],
        (err, results) => {
            if (err) return res.status(500).json({ existe: false });

            if (results.length === 0) {
                return res.status(404).json({ existe: false }); // ← estudiante eliminado
            }

            res.status(200).json({ existe: true });
        }
    );
});
module.exports = router;