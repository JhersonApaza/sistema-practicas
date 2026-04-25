const express = require('express');
const router = express.Router();
const path = require('path');
const recuperarController = require('../controllers/recuperarController');

// Mostrar formulario de envío de código
router.get('/recuperar-contrasena', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/Formulario_contrasena/enviarCodigo.html'));
});

// API: Enviar código al correo
router.post('/recuperar/enviar-codigo', recuperarController.enviarCodigo);

// API: Verificar código ingresado
router.post('/recuperar/verificar-codigo', recuperarController.verificarCodigo);

// Mostrar formulario de nueva contraseña
router.get('/recuperar/nueva-contrasena', recuperarController.mostrarFormularioCambio);

// API: Guardar nueva contraseña
router.post('/recuperar/cambiar-contrasena', recuperarController.cambiarContrasena);

module.exports = router;
