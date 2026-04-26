const db = require('../config/db');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'di6mgzute',
    api_key: '779395288726242',
    api_secret: 'jjktWhgwd08YUBqeeoNlOFX9eVg'
});

exports.subirImagen = (req, res) => {
    if (!req.body.imagen) {
        return res.status(400).json({ error: "No se recibió imagen" });
    }

    cloudinary.uploader.upload(req.body.imagen, {
        folder: 'chat'
    }, (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error al subir" });
        }
        res.status(200).json({ url: result.secure_url });
    });
};

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