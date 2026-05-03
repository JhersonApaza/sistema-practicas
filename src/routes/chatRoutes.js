const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatController');

router.get('/api/chat/mensajes', ctrl.getMensajes);
router.post('/api/chat/enviar', ctrl.enviarMensaje);
router.post('/api/chat/upload', ctrl.subirImagen);
router.delete('/api/chat/:id', ctrl.eliminarMensaje);
router.put('/api/chat/:id', ctrl.editarMensaje);   
// router.patch('/:id', chatController.editarMensaje);

module.exports = router;