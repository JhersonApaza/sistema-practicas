const db = require('../config/db');

exports.getMensajes = (req, res) => {
    const sql = "SELECT * FROM mensajes ORDER BY fecha ASC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener mensajes" });
        }

        res.json({
            data: results
        });
    });
};

exports.enviarMensaje = (req, res) => {
    const { mensaje, email, nombre, imagen_url } = req.body;

    const sql = `
        INSERT INTO mensajes (mensaje, email, nombre, imagen_url)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [mensaje, email, nombre, imagen_url], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al guardar mensaje" });
        }

        res.status(200).json({
            success: true
        });
    });
};

exports.eliminarMensaje = (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM mensajes WHERE id = ?", [id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al eliminar" });
        }

        res.status(200).json({
            success: true
        });
    });
};