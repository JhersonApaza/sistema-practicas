const db = require('../config/db');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'di6mgzute',
    api_key: '779395288726242',
    api_secret: 'jjktWhgwd08YUBqeeoNlOFX9eVg'
});

exports.subirImagen = (req, res) => {
    console.log("BODY imagen recibido:", req.body.imagen ? "SÍ llegó" : "NO llegó");

    if (!req.body.imagen) {
        return res.status(400).json({ error: "No se recibió imagen" });
    }

    cloudinary.uploader.upload(req.body.imagen, {
        folder: 'chat'
    }, (err, result) => {
        if (err) {
            console.error("ERROR CLOUDINARY:", err);
            return res.status(500).json({ error: "Error al subir" });
        }
        console.log("URL CLOUDINARY:", result.secure_url);
        res.status(200).json({ url: result.secure_url });
    });
};

exports.getMensajes = (req, res) => {
    const sql = "SELECT * FROM mensajes ORDER BY fecha ASC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener mensajes" });
        }
        res.json({ data: results });
    });
};

exports.enviarMensaje = (req, res) => {
    const { mensaje, email, nombre, imagen_url, rol } = req.body; // ← agrega rol

    const sql = `INSERT INTO mensajes (mensaje, email, nombre, imagen_url, rol)
                 VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [mensaje, email, nombre, imagen_url, rol || null], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al guardar mensaje" });
        res.status(200).json({ success: true });
    });
};

exports.eliminarMensaje = (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM mensajes WHERE id = ?", [id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al eliminar" });
        }
        res.status(200).json({ success: true });
    });
};

exports.editarMensaje = (req, res) => {
    const { id } = req.params;
    const { mensaje } = req.body;

    if (!mensaje || mensaje.trim() === '') {
        return res.status(400).json({ error: "El mensaje no puede estar vacío" });
    }

    db.query("UPDATE mensajes SET mensaje = ? WHERE id = ?", [mensaje.trim(), id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al editar mensaje" });
        }
        res.status(200).json({ success: true });
    });
};

exports.editarMensaje = (req, res) => {
    const { id } = req.params;
    const { mensaje } = req.body;

    if (!mensaje || !mensaje.trim()) {
        return res.status(400).json({ error: "Mensaje vacío" });
    }

    db.query("UPDATE mensajes SET mensaje = ? WHERE id = ?", [mensaje.trim(), id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al editar" });
        }
        res.status(200).json({ success: true });
    });
};