const db = require('../config/db');

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

exports.create = (req, res) => {
    const { nombre, apellido, dni, carrera, institucion, nota, correo, contrasenia } = req.body;
    const sql = `INSERT INTO estudiantes (nombre, apellido, dni, carrera, institucion, nota, correo, contrasenia, id_supervisor)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const valores = [nombre, apellido, dni, carrera, institucion, nota || null, correo, contrasenia, req.session.supervisor.id_supervisor];

    db.query(sql, valores, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: result.insertId });
    });
};

exports.update = (req, res) => {
    const { nombre, apellido, dni, carrera, institucion, nota, correo, contrasenia } = req.body;
    const sql = `UPDATE estudiantes SET nombre=?, apellido=?, dni=?, carrera=?, institucion=?, nota=?, correo=?, contrasenia=?
                 WHERE id_estudiante=?`;
    const valores = [nombre, apellido, dni, carrera, institucion, nota || null, correo, contrasenia, req.params.id];

    db.query(sql, valores, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};

exports.remove = (req, res) => {
    db.query('DELETE FROM estudiantes WHERE id_estudiante = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};

// ─── API REST (Android) ─────────────────────────────────────────

exports.apiLogin = (req, res) => {
    const { correo, contrasenia } = req.body;
    db.query('SELECT * FROM estudiantes WHERE correo = ?', [correo], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

        const est = results[0];
        if (est.contrasenia.trim() !== contrasenia.trim()) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        res.json({
            id: est.id_estudiante,
            nombre: est.nombre,
            apellido: est.apellido,
            dni: est.dni,
            carrera: est.carrera,
            institucion: est.institucion,
            nota: est.nota
        });
    });
};
