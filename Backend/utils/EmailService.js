const nodemailer = require('nodemailer')

const BG_IMAGE = 'https://i.imgur.com/pGXbtvw.jpeg'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const wrapWithBg = (accentColor = '#C1121F', innerContent) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#eef2f7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="640" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
    <tr>
      <td style="
        background-image:url('${BG_IMAGE}');
        background-size:cover;
        background-position:center center;
        background-repeat:no-repeat;
        padding:100px 0 100px 0;
      ">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="10%">&nbsp;</td>
            <td width="80%" style="
              background:#ffffff;
              padding:32px 32px 24px;
              border-radius:18px;
              box-shadow:0 6px 32px rgba(0,0,0,0.16);
              vertical-align:top;
            ">
              <!-- Logo -->
              <div style="text-align:center;margin-bottom:18px;padding-bottom:16px;border-bottom:2px solid #f0f4f8;">
                <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#003049;">AQUÍ<span style="color:${accentColor};">TENÉS</span></span>
                <p style="margin:4px 0 0;color:#94a3b8;font-size:9px;text-transform:uppercase;letter-spacing:2px;">Directorio de Negocios PYME</p>
              </div>
              ${innerContent}
              <!-- Footer -->
              <p style="color:#cbd5e1;font-size:10px;margin:20px 0 0;padding-top:16px;border-top:1px solid #f0f4f8;text-align:center;letter-spacing:0.5px;">
                &copy; ${new Date().getFullYear()} AquíTenés &middot; Universidad Mariano Gálvez de Guatemala
              </p>
            </td>
            <td width="10%">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

const badge = (text, bg, color) =>
  `<span style="display:inline-block;background:${bg};color:${color};font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1.2px;padding:4px 10px;border-radius:999px;">${text}</span>`

const divider = `<div style="height:1px;background:#f0f4f8;margin:20px 0;"></div>`

const btnStyle = (bg) =>
  `display:inline-block;background:${bg};color:#fff;text-decoration:none;padding:13px 32px;border-radius:999px;font-weight:900;font-size:11px;text-transform:uppercase;letter-spacing:1.8px;box-shadow:0 4px 14px rgba(0,0,0,0.18);`

const infoRow = (label, value, last = false) => `
  <tr>
    <td style="padding:10px 0;${last ? '' : 'border-bottom:1px solid #f0f4f8;'}color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;width:36%;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;${last ? '' : 'border-bottom:1px solid #f0f4f8;'}color:#003049;font-size:12px;font-weight:700;vertical-align:top;">${value}</td>
  </tr>`

// ── Correo: negocio aprobado ────────────────────────────
const sendBusinessApproved = async (correo, nombreUsuario, nombreNegocio) => {
  const inner = `
    <div style="margin-bottom:6px;">${badge('✓ Aprobado', '#dcfce7', '#16a34a')}</div>
    <h2 style="margin:12px 0 4px;font-size:22px;font-weight:900;color:#003049;letter-spacing:-0.5px;">¡Tu negocio está activo!</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.6;">Hola <strong>${nombreUsuario}</strong>, tenemos buenas noticias para ti.</p>
    ${divider}
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;color:#003049;font-size:13px;line-height:1.7;">
        Tu negocio <strong>${nombreNegocio}</strong> fue revisado y aprobado. Ya aparece en el directorio AquíTenés y los clientes pueden encontrarte desde ahora.
      </p>
    </div>
    <p style="color:#64748b;font-size:12px;line-height:1.7;margin:0 0 24px;">
      Accede a tu panel para completar tu perfil, subir fotos y agregar productos o servicios para destacar entre los demás negocios.
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${process.env.FRONTEND_URL}/mi-negocio" style="${btnStyle('#C1121F')}">Ver mi negocio →</a>
    </div>
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: `✅ Tu negocio "${nombreNegocio}" fue aprobado en AquíTenés`,
    html: wrapWithBg('#22c55e', inner)
  })
}

// ── Correo: negocio rechazado ───────────────────────────
const sendBusinessRejected = async (correo, nombreUsuario, nombreNegocio) => {
  const inner = `
    <div style="margin-bottom:6px;">${badge('Solicitud revisada', '#fef2f2', '#dc2626')}</div>
    <h2 style="margin:12px 0 4px;font-size:22px;font-weight:900;color:#003049;letter-spacing:-0.5px;">Actualización de tu solicitud</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.6;">Hola <strong>${nombreUsuario}</strong>, hemos revisado tu solicitud.</p>
    ${divider}
    <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;color:#7f1d1d;font-size:13px;line-height:1.7;">
        Tu solicitud para <strong>${nombreNegocio}</strong> no fue aprobada en esta ocasión. Te invitamos a volver a enviarla con más información sobre tu negocio.
      </p>
    </div>
    <p style="color:#64748b;font-size:12px;line-height:1.7;margin:0 0 24px;">
      Asegúrate de incluir una descripción completa, categoría correcta y datos de contacto actualizados para que tu solicitud sea aprobada.
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${process.env.FRONTEND_URL}/registrar-negocio" style="${btnStyle('#003049')}">Enviar nueva solicitud →</a>
    </div>
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: `Actualización sobre tu solicitud en AquíTenés`,
    html: wrapWithBg('#ef4444', inner)
  })
}

// ── Correo: recuperar contraseña ────────────────────────
const sendPasswordReset = async (correo, nombreUsuario, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
  const inner = `
    <div style="margin-bottom:6px;">${badge('🔒 Seguridad', '#fef2f2', '#C1121F')}</div>
    <h2 style="margin:12px 0 4px;font-size:22px;font-weight:900;color:#003049;letter-spacing:-0.5px;">Restablecer contraseña</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.6;">Hola <strong>${nombreUsuario}</strong>, recibimos una solicitud de cambio.</p>
    ${divider}
    <p style="color:#475569;font-size:13px;line-height:1.7;margin:0 0 24px;">
      Haz clic en el botón para crear una nueva contraseña. Este enlace es válido por <strong style="color:#003049;">1 hora</strong> y solo puede usarse una vez.
    </p>
    <div style="text-align:center;margin-bottom:20px;">
      <a href="${resetUrl}" style="${btnStyle('#C1121F')}">Restablecer contraseña →</a>
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;">
      <p style="margin:0;color:#991b1b;font-size:11px;line-height:1.6;">
        ⚠️ Si no solicitaste este cambio, ignora este correo. Tu contraseña actual permanecerá sin cambios.
      </p>
    </div>
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: '🔒 Restablece tu contraseña de AquíTenés',
    html: wrapWithBg('#C1121F', inner)
  })
}

// ── Correo: nueva solicitud de negocio (a todos los admins) ─
const sendNewBusinessRequest = async (nombreNegocio, nombreUsuario, correoUsuario, adminEmails = []) => {
  if (adminEmails.length === 0) return
  const inner = `
    <div style="margin-bottom:6px;">${badge('🔔 Nueva solicitud', '#fefce8', '#ca8a04')}</div>
    <h2 style="margin:12px 0 4px;font-size:22px;font-weight:900;color:#003049;letter-spacing:-0.5px;">Nuevo negocio por revisar</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.6;">Un emprendedor ha enviado una solicitud de registro.</p>
    ${divider}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      ${infoRow('Negocio', nombreNegocio)}
      ${infoRow('Solicitante', nombreUsuario)}
      ${infoRow('Correo', correoUsuario, true)}
    </table>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${process.env.FRONTEND_URL}/admin" style="${btnStyle('#003049')}">Revisar en el panel →</a>
    </div>
  `
  await Promise.all(adminEmails.map(correo =>
    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: correo,
      subject: `🔔 Nueva solicitud: "${nombreNegocio}"`,
      html: wrapWithBg('#f59e0b', inner)
    })
  ))
}

// ── Correo: nueva reseña al vendedor ───────────────────
const sendNewReview = async (correoEmprendedor, nombreEmprendedor, nombreNegocio, puntuacion, comentario) => {
  const estrellas = '★'.repeat(puntuacion) + '☆'.repeat(5 - puntuacion)
  const colores = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']
  const accentReview = colores[puntuacion] || '#f59e0b'
  const inner = `
    <div style="margin-bottom:6px;">${badge('Nueva reseña', '#fefce8', '#ca8a04')}</div>
    <h2 style="margin:12px 0 4px;font-size:22px;font-weight:900;color:#003049;letter-spacing:-0.5px;">Alguien valoró tu negocio</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.6;">Hola <strong>${nombreEmprendedor}</strong>, tienes una nueva reseña en <strong>${nombreNegocio}</strong>.</p>
    ${divider}
    <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 6px;font-size:32px;letter-spacing:4px;color:${accentReview};">${estrellas}</p>
      <p style="margin:0;font-size:28px;font-weight:900;color:#003049;">${puntuacion}<span style="font-size:14px;color:#94a3b8;font-weight:400;"> / 5</span></p>
    </div>
    ${comentario ? `
    <div style="background:#f8fafc;border-left:4px solid ${accentReview};border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0 0 4px;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Comentario</p>
      <p style="margin:0;color:#003049;font-size:13px;line-height:1.7;font-style:italic;">"${comentario}"</p>
    </div>` : ''}
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${process.env.FRONTEND_URL}/mi-negocio" style="${btnStyle('#C1121F')}">Ver mi negocio →</a>
    </div>
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correoEmprendedor,
    subject: `⭐ Nueva reseña en "${nombreNegocio}" — ${estrellas}`,
    html: wrapWithBg(accentReview, inner)
  })
}

// ── Correo: negocio desactivado ─────────────────────────
const sendBusinessDeactivated = async (correo, nombreUsuario, nombreNegocio) => {
  const inner = `
    <div style="margin-bottom:6px;">${badge('Negocio pausado', '#f1f5f9', '#64748b')}</div>
    <h2 style="margin:12px 0 4px;font-size:22px;font-weight:900;color:#003049;letter-spacing:-0.5px;">Tu negocio fue desactivado</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.6;">Hola <strong>${nombreUsuario}</strong>, te informamos sobre un cambio en tu negocio.</p>
    ${divider}
    <div style="background:#f8fafc;border-left:4px solid #64748b;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;color:#475569;font-size:13px;line-height:1.7;">
        Tu negocio <strong style="color:#003049;">${nombreNegocio}</strong> ha sido desactivado temporalmente por un administrador y ya no es visible en el directorio.
      </p>
    </div>
    <p style="color:#64748b;font-size:12px;line-height:1.7;margin:0 0 24px;">
      Si tienes alguna duda o crees que esto fue un error, contáctanos respondiendo a este correo.
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${process.env.FRONTEND_URL}" style="${btnStyle('#64748b')}">Ir a AquíTenés →</a>
    </div>
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: `Tu negocio "${nombreNegocio}" fue desactivado en AquíTenés`,
    html: wrapWithBg('#64748b', inner)
  })
}

// ── Correo: negocio reactivado ──────────────────────────
const sendBusinessActivated = async (correo, nombreUsuario, nombreNegocio) => {
  const inner = `
    <div style="margin-bottom:6px;">${badge('▶ Reactivado', '#eff6ff', '#2563eb')}</div>
    <h2 style="margin:12px 0 4px;font-size:22px;font-weight:900;color:#003049;letter-spacing:-0.5px;">¡Tu negocio vuelve a estar activo!</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.6;">Hola <strong>${nombreUsuario}</strong>, buenas noticias.</p>
    ${divider}
    <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;color:#1e3a5f;font-size:13px;line-height:1.7;">
        Tu negocio <strong>${nombreNegocio}</strong> ha sido reactivado por un administrador y ya es visible nuevamente en el directorio AquíTenés.
      </p>
    </div>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${process.env.FRONTEND_URL}/mi-negocio" style="${btnStyle('#003049')}">Ver mi negocio →</a>
    </div>
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: `▶ Tu negocio "${nombreNegocio}" fue reactivado en AquíTenés`,
    html: wrapWithBg('#3b82f6', inner)
  })
}

module.exports = {
  sendBusinessApproved,
  sendBusinessRejected,
  sendPasswordReset,
  sendNewBusinessRequest,
  sendNewReview,
  sendBusinessDeactivated,
  sendBusinessActivated
}
