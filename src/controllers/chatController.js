const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

exports.subirImagen = [
    upload.single('imagen'),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                error: "No se subió ninguna imagen"
            });
        }

        const imageUrl = `https://sistema-practicas.onrender.com/uploads/${req.file.filename}`;

        res.status(200).json({
            url: imageUrl
        });
    }
];

exports.getMensajes = (req, res) => {
    const sql = "SELECT * FROM mensajes ORDER BY fecha ASC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Error al obtener mensajes"
            });
        }

        res.json({
            data: results
        });
    });
};

exports.enviarMensaje = (req, res) => {
    console.log("BODY RECIBIDO:", req.body);

    const { mensaje, email, nombre, imagen_url } = req.body;

    const sql = `
        INSERT INTO mensajes (mensaje, email, nombre, imagen_url)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [mensaje, email, nombre, imagen_url], (err, result) => {
        if (err) {
            console.error("ERROR SQL:", err);
            return res.status(500).json({
                error: "Error al guardar mensaje"
            });
        }

        res.status(200).json({
            success: true
        });
    });
};

exports.eliminarMensaje = (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM mensajes WHERE id = ?",
        [id],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: "Error al eliminar"
                });
            }

            res.status(200).json({
                success: true
            });
        }
    );
};