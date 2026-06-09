const nodemailer = require('nodemailer')

const BG_IMAGE = 'https://i.imgur.com/pGXbtvw.jpeg'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const adminTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL_USER,
    pass: process.env.ADMIN_EMAIL_PASS
  }
})

const wrapWithBg = (innerContent) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#eef2f7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="640" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
    <tr>
      <td style="
        background-image:url('${BG_IMAGE}');
        background-size:cover;
        background-position:center center;
        background-repeat:no-repeat;
        padding:140px 0 140px 0;
      ">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="22%">&nbsp;</td>
            <td width="56%" style="
              background:#ffffff;
              padding:28px 26px;
              border-radius:16px;
              box-shadow:0 4px 24px rgba(0,0,0,0.12);
              vertical-align:top;
            ">
              <div style="text-align:center;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #f0f4f8;">
                <span style="font-size:20px;font-weight:900;letter-spacing:-0.5px;color:#003049;">AQUÍ<span style="color:#C1121F;">TENES</span></span>
              </div>
              ${innerContent}
            </td>
            <td width="22%">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

const iconCheck = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:6px;" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#22c55e"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const iconX = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:6px;" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#ef4444"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`
const iconLock = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:6px;" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#C1121F"/><rect x="8" y="11" width="8" height="6" rx="1.5" fill="#fff"/><path d="M9.5 11V9a2.5 2.5 0 015 0v2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`
const iconBell = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:6px;" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#f59e0b"/><path d="M12 7a3 3 0 00-3 3v2l-1 1.5h8L15 12v-2a3 3 0 00-3-3z" fill="#fff"/><circle cx="12" cy="17" r="1" fill="#fff"/></svg>`
const iconPause = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:6px;" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#64748b"/><rect x="8" y="7" width="3" height="10" rx="1" fill="#fff"/><rect x="13" y="7" width="3" height="10" rx="1" fill="#fff"/></svg>`
const iconPlay = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:6px;" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#003049"/><path d="M10 8l6 4-6 4V8z" fill="#fff"/></svg>`

const btnStyle = (bg) => `display:inline-block;background:${bg};color:#fff;text-decoration:none;padding:11px 26px;border-radius:999px;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;`

const footer = `
  <p style="color:#cbd5e1;font-size:10px;margin:14px 0 0;text-align:center;letter-spacing:0.5px;">
    &copy; ${new Date().getFullYear()} AquíTenes &middot; Universidad Mariano Gálvez de Guatemala
  </p>
`

// ── Correo: negocio aprobado ────────────────────────────
const sendBusinessApproved = async (correo, nombreUsuario, nombreNegocio) => {
  const inner = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#003049;">${iconCheck} Solicitud Aprobada</p>
    <p style="color:#64748b;font-size:11px;margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid #f0f4f8;">Tu negocio ya es visible en el directorio.</p>
    <p style="color:#1e293b;font-size:13px;font-weight:700;margin:0 0 6px;">Hola, ${nombreUsuario}</p>
    <p style="color:#64748b;font-size:11px;line-height:1.7;margin:0 0 14px;">
      Tu negocio <strong style="color:#003049;">${nombreNegocio}</strong> fue aprobado y ya aparece en el directorio AquíTenes. Los clientes ahora pueden encontrarte.
    </p>
    <p style="color:#64748b;font-size:11px;line-height:1.7;margin:0 0 16px;">
      Accede a tu panel para completar tu perfil, subir fotos y agregar productos o servicios.
    </p>
    <div style="text-align:center;margin-bottom:4px;">
      <a href="${process.env.FRONTEND_URL}/mi-negocio" style="${btnStyle('#C1121F')}">Ver mi negocio</a>
    </div>
    ${footer}
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: `Tu negocio "${nombreNegocio}" fue aprobado en AquíTenes`,
    html: wrapWithBg(inner)
  })
}

// ── Correo: negocio rechazado ───────────────────────────
const sendBusinessRejected = async (correo, nombreUsuario, nombreNegocio) => {
  const inner = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#003049;">${iconX} Solicitud Revisada</p>
    <p style="color:#64748b;font-size:11px;margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid #f0f4f8;">Hemos revisado tu solicitud de negocio.</p>
    <p style="color:#1e293b;font-size:13px;font-weight:700;margin:0 0 6px;">Hola, ${nombreUsuario}</p>
    <p style="color:#64748b;font-size:11px;line-height:1.7;margin:0 0 16px;">
      Tu solicitud para <strong style="color:#003049;">${nombreNegocio}</strong> no fue aprobada en esta ocasión. Te invitamos a enviar una nueva solicitud con información más detallada sobre tu negocio.
    </p>
    <div style="text-align:center;margin-bottom:4px;">
      <a href="${process.env.FRONTEND_URL}/registrar-negocio" style="${btnStyle('#003049')}">Enviar nueva solicitud</a>
    </div>
    ${footer}
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: `Actualización sobre tu solicitud en AquíTenes`,
    html: wrapWithBg(inner)
  })
}

// ── Correo: recuperar contraseña ────────────────────────
const sendPasswordReset = async (correo, nombreUsuario, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
  const inner = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#003049;">${iconLock} Restablecer Contraseña</p>
    <p style="color:#64748b;font-size:11px;margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid #f0f4f8;">Solicitud de cambio de contraseña recibida.</p>
    <p style="color:#1e293b;font-size:13px;font-weight:700;margin:0 0 6px;">Hola, ${nombreUsuario}</p>
    <p style="color:#64748b;font-size:11px;line-height:1.7;margin:0 0 16px;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva. Este enlace es válido por <strong>1 hora</strong>.
    </p>
    <div style="text-align:center;margin-bottom:12px;">
      <a href="${resetUrl}" style="${btnStyle('#C1121F')}">Restablecer contraseña</a>
    </div>
    <div style="background:#fef2f2;border-left:3px solid #C1121F;border-radius:6px;padding:8px 12px;">
      <p style="margin:0;color:#991b1b;font-size:10px;line-height:1.5;">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual permanecerá sin cambios.</p>
    </div>
    ${footer}
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: 'Restablece tu contraseña de AquíTenes',
    html: wrapWithBg(inner)
  })
}

// ── Correo: nueva solicitud de negocio (al admin) ───────
const sendNewBusinessRequest = async (nombreNegocio, nombreUsuario, correoUsuario) => {
  const inner = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#003049;">${iconBell} Nueva Solicitud de Negocio</p>
    <p style="color:#64748b;font-size:11px;margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid #f0f4f8;">Un emprendedor ha enviado una solicitud.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0f4f8;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;width:38%;">Negocio</td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f4f8;color:#003049;font-size:11px;font-weight:700;">${nombreNegocio}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0f4f8;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;">Solicitante</td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f4f8;color:#003049;font-size:11px;font-weight:700;">${nombreUsuario}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;">Correo</td>
        <td style="padding:6px 0;color:#003049;font-size:11px;font-weight:700;">${correoUsuario}</td>
      </tr>
    </table>
    <div style="text-align:center;margin-bottom:4px;">
      <a href="${process.env.FRONTEND_URL}/admin" style="${btnStyle('#003049')}">Revisar en el panel</a>
    </div>
    ${footer}
  `
  await adminTransporter.sendMail({
    from: `AquiTenes <${process.env.ADMIN_EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `Nueva solicitud de negocio: "${nombreNegocio}"`,
    html: wrapWithBg(inner)
  })
}

// ── Correo: nueva reseña al vendedor ───────────────────
const sendNewReview = async (correoEmprendedor, nombreEmprendedor, nombreNegocio, puntuacion, comentario) => {
  const estrellas = '★'.repeat(puntuacion) + '☆'.repeat(5 - puntuacion)
  const inner = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#003049;">Nueva reseña en tu negocio</p>
    <p style="color:#64748b;font-size:11px;margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid #f0f4f8;">Alguien dejó una reseña en <strong>${nombreNegocio}</strong>.</p>
    <p style="color:#1e293b;font-size:13px;font-weight:700;margin:0 0 6px;">Hola, ${nombreEmprendedor}</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0f4f8;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;width:38%;">Calificación</td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f4f8;color:#f59e0b;font-size:16px;font-weight:700;">${estrellas} (${puntuacion}/5)</td>
      </tr>
      ${comentario ? `<tr>
        <td style="padding:6px 0;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;">Comentario</td>
        <td style="padding:6px 0;color:#003049;font-size:11px;">"${comentario}"</td>
      </tr>` : ''}
    </table>
    <div style="text-align:center;margin-bottom:4px;">
      <a href="${process.env.FRONTEND_URL}/mi-negocio" style="${btnStyle('#C1121F')}">Ver mi negocio</a>
    </div>
    ${footer}
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correoEmprendedor,
    subject: `Nueva reseña en "${nombreNegocio}" — ${estrellas}`,
    html: wrapWithBg(inner)
  })
}

// ── Correo: negocio desactivado ─────────────────────────
const sendBusinessDeactivated = async (correo, nombreUsuario, nombreNegocio) => {
  const inner = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#003049;">${iconPause} Negocio Desactivado</p>
    <p style="color:#64748b;font-size:11px;margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid #f0f4f8;">Tu negocio ha sido desactivado temporalmente.</p>
    <p style="color:#1e293b;font-size:13px;font-weight:700;margin:0 0 6px;">Hola, ${nombreUsuario}</p>
    <p style="color:#64748b;font-size:11px;line-height:1.7;margin:0 0 16px;">
      Tu negocio <strong style="color:#003049;">${nombreNegocio}</strong> ha sido desactivado por un administrador y ya no es visible en el directorio. Si tienes alguna duda, contáctanos.
    </p>
    <div style="text-align:center;margin-bottom:4px;">
      <a href="${process.env.FRONTEND_URL}" style="${btnStyle('#64748b')}">Ir a AquíTenes</a>
    </div>
    ${footer}
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: `Tu negocio "${nombreNegocio}" fue desactivado en AquíTenes`,
    html: wrapWithBg(inner)
  })
}

// ── Correo: negocio reactivado ──────────────────────────
const sendBusinessActivated = async (correo, nombreUsuario, nombreNegocio) => {
  const inner = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#003049;">${iconPlay} Negocio Reactivado</p>
    <p style="color:#64748b;font-size:11px;margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid #f0f4f8;">Tu negocio vuelve a estar visible en el directorio.</p>
    <p style="color:#1e293b;font-size:13px;font-weight:700;margin:0 0 6px;">Hola, ${nombreUsuario}</p>
    <p style="color:#64748b;font-size:11px;line-height:1.7;margin:0 0 16px;">
      Tu negocio <strong style="color:#003049;">${nombreNegocio}</strong> ha sido reactivado por un administrador y ya es visible nuevamente en el directorio AquíTenes.
    </p>
    <div style="text-align:center;margin-bottom:4px;">
      <a href="${process.env.FRONTEND_URL}/mi-negocio" style="${btnStyle('#003049')}">Ver mi negocio</a>
    </div>
    ${footer}
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: `Tu negocio "${nombreNegocio}" fue reactivado en AquíTenes`,
    html: wrapWithBg(inner)
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