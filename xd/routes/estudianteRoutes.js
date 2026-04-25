const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/estudianteController');

// Middleware: proteger rutas web
const auth = (req, res, next) => {
    if (!req.session.supervisor) return res.redirect('/login');
    next();
};

// Web CRUD
router.get('/api/estudiantes', auth, ctrl.getAll);
router.get('/api/estudiantes/:id', auth, ctrl.getOne);
router.post('/api/estudiantes', auth, ctrl.create);
router.put('/api/estudiantes/:id', auth, ctrl.update);
router.delete('/api/estudiantes/:id', auth, ctrl.remove);

// API pública para Android
router.post('/api/auth/estudiante', ctrl.apiLogin);

module.exports = router;
