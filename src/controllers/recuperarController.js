const nodemailer = require('nodemailer');
const db = require('../config/db');
const bcrypt = require('bcrypt');

// ── Almacén temporal de códigos (clave: correo → {codigo, expiracion, intentos})
const codigosTemporales = new Map();

// ── Configurar transporter de Gmail ─────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   // tu correo Gmail en .env
    pass: process.env.EMAIL_PASS    // contraseña de aplicación en .env
  }
});

// ── Generar código de 6 dígitos ─────────────────────────────────────────
function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── POST /recuperar/enviar-codigo ────────────────────────────────────────
exports.enviarCodigo = async (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.json({ ok: false, mensaje: 'Correo requerido.' });
  }

  // Verificar que el correo existe en la BD
  db.query('SELECT * FROM supervisores WHERE correo = ?', [correo.trim()], async (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.json({ ok: false, mensaje: 'Error en el servidor.' });
    }

    if (results.length === 0) {
      return res.json({ ok: false, mensaje: 'No existe una cuenta con ese correo.' });
    }

    const codigo = generarCodigo();
    const expiracion = Date.now() + 10 * 60 * 1000; // 10 minutos

    codigosTemporales.set(correo.trim(), { codigo, expiracion, intentos: 0 });

    // Enviar email
    try {
      await transporter.sendMail({
        from: `"Sistema de Prácticas" <${process.env.EMAIL_USER}>`,
        to: correo.trim(),
        subject: 'Código de verificación — Recuperar contraseña',
        html: `
          <div style="font-family: 'Sora', Arial, sans-serif; max-width: 480px; margin: auto; background: #0b0f1a; color: #f1f5f9; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 32px; text-align: center;">
            </div>
            <div style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #94a3b8; font-size: 14px;">
                Hola, recibimos una solicitud para recuperar tu contraseña.<br>
                Usa el siguiente código de verificación:
              </p>
              <div style="background: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 28px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #a5b4fc;">${codigo}</span>
              </div>
              <p style="font-size: 12px; color: #475569; text-align: center;">
                ⏰ Este código expira en <strong style="color:#818cf8;">10 minutos</strong>
              </p>
              <p style="font-size: 12px; color: #334155; margin-top: 20px;">
                Si no solicitaste esto, ignora este mensaje. Tu contraseña no será cambiada.
              </p>
            </div>
            <div style="background: #0b0f1a; border-top: 1px solid #1e293b; padding: 16px 32px; text-align: center;">
              <span style="font-size: 11px; font-family: monospace; color: #334155;">Sistema de Calificación de Prácticas</span>
            </div>
          </div>
        `
      });

      console.log(` Código enviado a ${correo}: ${codigo}`);
      return res.json({ ok: true });

    } catch (emailErr) {
      console.error('Error al enviar email:', emailErr);
      return res.json({ ok: false, mensaje: 'No se pudo enviar el correo. Verifica la configuración.' });
    }
  });
};

// ── POST /recuperar/verificar-codigo ────────────────────────────────────
exports.verificarCodigo = (req, res) => {
  const { correo, codigo } = req.body;

  if (!correo || !codigo) {
    return res.json({ ok: false, mensaje: 'Datos incompletos.' });
  }

  const datos = codigosTemporales.get(correo.trim());

  if (!datos) {
    return res.json({ ok: false, mensaje: 'No hay un código activo para este correo.' });
  }

  // Verificar expiración
  if (Date.now() > datos.expiracion) {
    codigosTemporales.delete(correo.trim());
    return res.json({ ok: false, mensaje: 'El código expiró. Solicita uno nuevo.' });
  }

  // Verificar intentos (máximo 5)
  datos.intentos++;
  if (datos.intentos > 5) {
    codigosTemporales.delete(correo.trim());
    return res.json({ ok: false, mensaje: 'Demasiados intentos. Solicita un nuevo código.' });
  }

  if (datos.codigo !== codigo.trim()) {
    return res.json({ ok: false, mensaje: `Código incorrecto. Intentos restantes: ${5 - datos.intentos + 1}` });
  }

  // Código correcto — marcar como verificado en sesión y eliminar
  codigosTemporales.delete(correo.trim());
  // Guardamos en un segundo mapa que el correo fue verificado (para permitir cambio de contraseña)
  codigosVerificados.set(correo.trim(), Date.now() + 5 * 60 * 1000); // 5 min para cambiar

  return res.json({ ok: true });
};

// ── Mapa de correos verificados ─────────────────────────────────────────
const codigosVerificados = new Map();

// ── GET /recuperar/nueva-contrasena ─────────────────────────────────────
exports.mostrarFormularioCambio = (req, res) => {
  const path = require('path');
  res.sendFile(path.join(__dirname, '../views/Formulario_contrasena/CambiarContrasena.html'));
};

// ── POST /recuperar/cambiar-contrasena ──────────────────────────────────
exports.cambiarContrasena = async (req, res) => {
  const { correo, nuevaContrasena } = req.body;

  if (!correo || !nuevaContrasena) {
    return res.json({ ok: false, mensaje: 'Datos incompletos.' });
  }

  // Verificar que el correo fue validado
  const expiracion = codigosVerificados.get(correo.trim());
  if (!expiracion || Date.now() > expiracion) {
    return res.json({ ok: false, mensaje: 'Sesión de recuperación expirada.' });
  }

  try {
    // 🔐 HASH DE LA NUEVA CONTRASEÑA
    const hash = await bcrypt.hash(nuevaContrasena.trim(), 10);

    const sql = 'UPDATE supervisores SET contrasenia = ? WHERE correo = ?';

    db.query(sql, [hash, correo.trim()], (err, result) => {
      if (err) {
        console.error('Error al actualizar contraseña:', err);
        return res.json({ ok: false, mensaje: 'Error al guardar la contraseña.' });
      }

      codigosVerificados.delete(correo.trim());

      console.log(`🔐 Contraseña actualizada (HASH) para: ${correo}`);
      return res.json({ ok: true });
    });

  } catch (error) {
    console.error(error);
    return res.json({ ok: false, mensaje: 'Error en el servidor.' });
  }
};