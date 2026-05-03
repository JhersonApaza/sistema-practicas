const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.login = (req, res) => {
    const { correo, contrasenia } = req.body;

    // ✅ VALIDACIÓN
    if (!correo || !contrasenia) {
        return res.redirect('/login?error=1');
    }

    const sql = `SELECT * FROM supervisores WHERE correo = ?`;

    db.query(sql, [correo.trim()], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en servidor');
        }

        if (results.length === 0) {
            return res.redirect('/login?error=1');
        }

        const supervisor = results[0];

        const match = await bcrypt.compare(
            contrasenia.trim(),
            supervisor.contrasenia
        );

        if (!match) {
            return res.redirect('/login?error=1');
        }

        req.session.supervisor = {
            id_supervisor: supervisor.id_supervisor,
            nombre: supervisor.nombre,
            correo: supervisor.correo
        };

        return res.redirect('/dashboard');
    });
};

// ✅ LOGOUT
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};

// LOGIN ESTUDIANTE
exports.loginEstudiante = (req, res) => {
    const { correo, contrasenia } = req.body;

    const sql = `SELECT * FROM estudiantes WHERE correo = ?`;

    db.query(sql, [correo.trim()], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en servidor');
        }

        if (results.length === 0) {
            return res.redirect('/login-estudiante?error=1');
        }

        const estudiante = results[0];

        // 🔐 comparar hash
        const match = await bcrypt.compare(
            contrasenia.trim(),
            estudiante.contrasenia
        );

        if (!match) {
            return res.redirect('/login-estudiante?error=1');
        }

        // ✅ guardar sesión
        req.session.estudiante = {
            id_estudiante: estudiante.id_estudiante,
            nombre: estudiante.nombre,
            correo: estudiante.correo
        };

        return res.redirect('/dashboard-estudiante');
    });
};