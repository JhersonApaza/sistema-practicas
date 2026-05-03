const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/estudianteController');
const estudianteController = require('../controllers/estudianteController');

const auth = (req, res, next) => {
    if (!req.session.supervisor) return res.redirect('/login');
    next();
};

// Web CRUD
router.get('/api/estudiantes',          auth, ctrl.getAll);
router.get('/api/estudiantes/:id',      auth, ctrl.getOne);
router.post('/api/estudiantes',         auth, ctrl.create);
router.put('/api/estudiantes/:id',      auth, ctrl.update);
router.delete('/api/estudiantes/:id',   auth, ctrl.remove);

// Nuevos endpoints PATCH
router.patch('/api/estudiantes/:id/telefono', auth, ctrl.updateTelefono);
router.patch('/api/estudiantes/:id/nota',     auth, ctrl.updateNota);
router.get('/api/verificar-sesion/:correo', estudianteController.apiVerificarSesion);

// API pública para Android
router.post('/api/auth/estudiante', ctrl.apiLogin);
router.post('/api/cambiar-contrasenia', estudianteController.apiCambiarContrasenia);

module.exports = router;
