const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const path = require('path');
const db = require('../config/db');  // ← agrega este require

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.get('/api/supervisor', (req, res) => {
    if (!req.session.supervisor) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    const id = req.session.supervisor.id_supervisor;
    console.log('ID supervisor en sesión:', id);

    db.query(
        'SELECT nombre, apellido, correo FROM supervisores WHERE id_supervisor = ?',
        [id],
        (err, results) => {
            if (err || results.length === 0) {
                console.error('Error BD:', err);
                return res.status(500).json({ error: 'Error al obtener supervisor' });
            }
            const s = results[0];
            console.log('Supervisor desde BD:', s);
            res.json({
                nombre: `${s.nombre} ${s.apellido || ''}`.trim(),
                correo: s.correo || ''
            });
        }
    );
});

module.exports = router;