const db = require('../config/db');

exports.login = (req, res) => {
    const { correo, contrasenia } = req.body;

    const sql = `SELECT * FROM supervisores WHERE correo = ?`;

    db.query(sql, [correo.trim()], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en servidor');
        }

        if (results.length === 0) {
            return res.redirect('/login?error=1');
        }

        const supervisor = results[0];

        if (supervisor.contrasenia.trim() !== contrasenia.trim()) {
            return res.redirect('/login?error=1');
        }

        req.session.supervisor = supervisor;
        return res.redirect('/dashboard');
    });
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};
