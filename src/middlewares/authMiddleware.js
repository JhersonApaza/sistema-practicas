exports.verificarSesion = (req, res, next) => {
    if (!req.session.supervisor) {
        return res.redirect('/login');
    }
    next();
};

exports.verificarEstudiante = (req, res, next) => {
    if (!req.session.estudiante) {
        return res.redirect('/login-estudiante');
    }
    next();
};