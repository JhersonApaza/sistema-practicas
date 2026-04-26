const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatController');

router.get('/api/chat/mensajes', ctrl.getMensajes);
router.post('/api/chat/enviar', ctrl.enviarMensaje);
router.delete('/api/chat/:id', ctrl.eliminarMensaje);

module.exports = router;