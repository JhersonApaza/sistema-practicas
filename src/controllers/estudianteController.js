const db = require('../config/db');
const bcrypt = require('bcrypt');

// ─── WEB (Supervisor) ───────────────────────────────────────────

exports.getAll = (req, res) => {
    db.query('SELECT * FROM estudiantes ORDER BY id_estudiante DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getOne = (req, res) => {
    db.query('SELECT * FROM estudiantes WHERE id_estudiante = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json(results[0]);
    });
};

exports.create = async (req, res) => {
    const { nombre, apellido, dni, carrera, institucion, correo, contrasenia, telefono } = req.body;

    try {
        const hash = await bcrypt.hash(contrasenia, 10); // ✅ hashear antes de guardar

        const sql = `INSERT INTO estudiantes (nombre, apellido, dni, carrera, institucion, correo, contrasenia, telefono, id_supervisor)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const valores = [nombre, apellido, dni, carrera, institucion, correo, hash, telefono || null, req.session.supervisor.id_supervisor];

        db.query(sql, valores, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: result.insertId });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    const { nombre, apellido, dni, carrera, institucion, correo, contrasenia } = req.body;

    try {
        let hash = contrasenia;

        // ✅ Solo hashear si se mandó una nueva contraseña en texto plano
        if (contrasenia && !contrasenia.startsWith('$2b$')) {
            hash = await bcrypt.hash(contrasenia, 10);
        }

        const sql = `UPDATE estudiantes SET nombre=?, apellido=?, dni=?, carrera=?, institucion=?, correo=?, contrasenia=?
                     WHERE id_estudiante=?`;
        const valores = [nombre, apellido, dni, carrera, institucion, correo, hash, req.params.id];

        db.query(sql, valores, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH: solo actualiza el teléfono
exports.updateTelefono = (req, res) => {
    const { telefono } = req.body;
    db.query(
        'UPDATE estudiantes SET telefono=? WHERE id_estudiante=?',
        [telefono || null, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
};

// PATCH: actualiza nota y comentario del supervisor
exports.updateNota = (req, res) => {
    const { nota, comentario } = req.body;
    db.query(
        'UPDATE estudiantes SET nota=?, comentario=? WHERE id_estudiante=?',
        [nota ?? null, comentario || null, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
};

exports.remove = (req, res) => {
    db.query('DELETE FROM estudiantes WHERE id_estudiante = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};

// ─── API REST (Android) ─────────────────────────────────────────

exports.apiLogin = async (req, res) => {
    const { correo, contrasenia } = req.body;

    db.query('SELECT * FROM estudiantes WHERE correo = ?', [correo], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

        const est = results[0];

        // ✅ comparar con bcrypt
        const match = await bcrypt.compare(contrasenia.trim(), est.contrasenia);
        if (!match) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        res.json({
            id: est.id_estudiante,
            nombre: est.nombre,
            apellido: est.apellido,
            dni: est.dni,
            carrera: est.carrera,
            institucion: est.institucion,
            nota: est.nota,
            telefono: est.telefono,
            comentario: est.comentario
        });
    });
};