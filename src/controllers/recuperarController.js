const { Resend } = require('resend');
const db = require('../config/db');
const bcrypt = require('bcrypt');

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Almacén temporal de códigos
const codigosTemporales = new Map();
const codigosVerificados = new Map();

// ── Generar código de 6 dígitos
function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── POST /recuperar/enviar-codigo
exports.enviarCodigo = async (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.json({ ok: false, mensaje: 'Correo requerido.' });
  }

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

    try {
      await resend.emails.send({
        from: 'Sistema de Prácticas <onboarding@resend.dev>',
        to: correo.trim(),
        subject: 'Código de verificación — Recuperar contraseña',
        html: `
          <body style="margin:0; padding:0; background:#f3f4f6; font-family: Arial, sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding: 32px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; border: 1px solid #d1d5db;">
    
                    <!-- HEADER -->
                    <tr>
                      <td style="background:#0f2d56; padding: 20px 28px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <p style="margin:0; font-size:13px; font-weight:700; color:#ffffff; letter-spacing:0.03em;">Sistema de Prácticas</p>
                              <p style="margin:2px 0 0; font-size:10px; color:rgba(255,255,255,0.5);">Soporte institucional</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
    
                    <!-- BODY -->
                    <tr>
                      <td style="padding: 28px 28px 22px;">
    
                        <p style="margin:0 0 6px; font-size:16px; font-weight:600; color:#0f2d56;">Recuperación de contraseña</p>
                        <div style="width:32px; height:2px; background:#0f2d56; border-radius:2px; margin-bottom:18px;"></div>
    
                        <p style="margin:0 0 20px; font-size:12px; color:#4b5563; line-height:1.7;">
                          Hemos recibido una solicitud para restablecer la contraseña asociada a su cuenta.
                          Ingrese el siguiente código en la plataforma para continuar:
                        </p>
    
                        <!-- Código -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4fa; border-left:4px solid #0f2d56; border-radius:4px; margin-bottom:18px;">
                          <tr>
                            <td style="padding: 22px 20px; text-align:center;">
                              <p style="margin:0 0 10px; font-size:10px; color:#6b7280; letter-spacing:0.1em; text-transform:uppercase;">Código de verificación</p>
                              <span style="font-family:'Courier New', Courier, monospace; font-size:46px; font-weight:700; letter-spacing:18px; color:#0f2d56;">${codigo}</span>
                            </td>
                          </tr>
                        </table>
    
                        <!-- Barra de tiempo -->
                        <p style="margin:0 0 6px; font-size:11px; color:#6b7280;">
                          Tiempo de vigencia &nbsp;<strong style="color:#0f2d56;">10 minutos</strong>
                        </p>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                          <tr>
                            <td style="background:#e5e7eb; border-radius:4px; height:6px;">
                              <div style="background:#0f2d56; height:6px; width:100%; border-radius:4px;"></div>
                            </td>
                          </tr>
                        </table>
    
                        <p style="margin:0; font-size:11px; color:#9ca3af; line-height:1.6;">
                          Si usted no realizó esta solicitud, puede ignorar este correo de forma segura. Su cuenta permanece protegida.
                        </p>
    
                      </td>
                    </tr>
    
                    <!-- FOOTER -->
                    <tr>
                      <td style="background:#fafafa; border-top:1px solid #f3f4f6; padding: 14px 28px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <p style="margin:0; font-size:10px; color:#9ca3af;">Sistema de Calificación de Prácticas Profesionales</p>
                            </td>
                            <td align="right">
                              <p style="margin:0; font-size:10px; color:#9ca3af;">Mensaje automático · No responder</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
    
                  </table>
                </td>
              </tr>
            </table>
          </body>
        `
      });
    
      console.log(`✅ Código enviado a ${correo}: ${codigo}`);
      return res.json({ ok: true });
    } catch (emailErr) {
      console.error('Error al enviar email:', emailErr);
      return res.json({ ok: false, mensaje: 'No se pudo enviar el correo. Verifica la configuración.' });
    }
  });
};

// ── POST /recuperar/verificar-codigo
exports.verificarCodigo = (req, res) => {
  const { correo, codigo } = req.body;

  if (!correo || !codigo) {
    return res.json({ ok: false, mensaje: 'Datos incompletos.' });
  }

  const datos = codigosTemporales.get(correo.trim());

  if (!datos) {
    return res.json({ ok: false, mensaje: 'No hay un código activo para este correo.' });
  }

  if (Date.now() > datos.expiracion) {
    codigosTemporales.delete(correo.trim());
    return res.json({ ok: false, mensaje: 'El código expiró. Solicita uno nuevo.' });
  }

  datos.intentos++;
  if (datos.intentos > 5) {
    codigosTemporales.delete(correo.trim());
    return res.json({ ok: false, mensaje: 'Demasiados intentos. Solicita un nuevo código.' });
  }

  if (datos.codigo !== codigo.trim()) {
    return res.json({ ok: false, mensaje: `Código incorrecto. Intentos restantes: ${5 - datos.intentos + 1}` });
  }

  codigosTemporales.delete(correo.trim());
  codigosVerificados.set(correo.trim(), Date.now() + 5 * 60 * 1000);

  return res.json({ ok: true });
};

// ── GET /recuperar/nueva-contrasena
exports.mostrarFormularioCambio = (req, res) => {
  const path = require('path');
  res.sendFile(path.join(__dirname, '../views/Formulario_contrasena/CambiarContrasena.html'));
};

// ── POST /recuperar/cambiar-contrasena
exports.cambiarContrasena = async (req, res) => {
  const { correo, nuevaContrasena } = req.body;

  if (!correo || !nuevaContrasena) {
    return res.json({ ok: false, mensaje: 'Datos incompletos.' });
  }

  const expiracion = codigosVerificados.get(correo.trim());
  if (!expiracion || Date.now() > expiracion) {
    return res.json({ ok: false, mensaje: 'Sesión de recuperación expirada.' });
  }

  try {
    const hash = await bcrypt.hash(nuevaContrasena.trim(), 10);

    db.query('UPDATE supervisores SET contrasenia = ? WHERE correo = ?', [hash, correo.trim()], (err) => {
      if (err) {
        console.error('Error al actualizar contraseña:', err);
        return res.json({ ok: false, mensaje: 'Error al guardar la contraseña.' });
      }

      codigosVerificados.delete(correo.trim());
      console.log(`🔐 Contraseña actualizada para: ${correo}`);
      return res.json({ ok: true });
    });

  } catch (error) {
    console.error(error);
    return res.json({ ok: false, mensaje: 'Error en el servidor.' });
  }
};
