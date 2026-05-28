const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// ── Correo: negocio aprobado ────────────────────────────
const sendBusinessApproved = async (correo, nombreUsuario, nombreNegocio) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <div style="background:#C1121F;padding:36px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;">AquíTENES</h1>
          <p style="color:rgba(255,255,255,.75);margin:8px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Directorio de Negocios Guatemala</p>
        </div>
        <div style="padding:40px;">
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:24px;">🎉</span>
            <div>
              <p style="margin:0;font-weight:900;color:#166534;font-size:14px;">¡Solicitud Aprobada!</p>
              <p style="margin:4px 0 0;color:#166534;font-size:13px;">Tu negocio ya está visible en el directorio.</p>
            </div>
          </div>
          <p style="color:#003049;font-size:16px;font-weight:700;margin:0 0 8px;">Hola, ${nombreUsuario} 👋</p>
          <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 24px;">
            Nos complace informarte que tu negocio <strong style="color:#003049;">${nombreNegocio}</strong> ha sido <strong style="color:#C1121F;">aprobado</strong> y ya aparece en el directorio AquíTenes. Ahora los clientes pueden encontrarte.
          </p>
          <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">
            Accede a tu panel de vendedor para completar tu perfil, agregar productos y gestionar tu información de contacto.
          </p>
          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL}/mi-negocio" style="display:inline-block;background:#C1121F;color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
              Ver mi negocio →
            </a>
          </div>
        </div>
        <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} AquíTenes · Universidad Mariano Gálvez de Guatemala</p>
        </div>
      </div>
    </body>
    </html>
  `
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: correo,
        subject: `✅ ¡Tu negocio "${nombreNegocio}" fue aprobado en AquíTenes!`,
        html
    })
}

// ── Correo: negocio rechazado ───────────────────────────
const sendBusinessRejected = async (correo, nombreUsuario, nombreNegocio) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <div style="background:#003049;padding:36px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;">AquíTENES</h1>
          <p style="color:rgba(255,255,255,.75);margin:8px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Directorio de Negocios Guatemala</p>
        </div>
        <div style="padding:40px;">
          <p style="color:#003049;font-size:16px;font-weight:700;margin:0 0 8px;">Hola, ${nombreUsuario}</p>
          <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 24px;">
            Lamentamos informarte que tu solicitud para registrar <strong style="color:#003049;">${nombreNegocio}</strong> no fue aprobada en esta ocasión. Puedes volver a enviar una solicitud con información más detallada.
          </p>
          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL}/registrar-negocio" style="display:inline-block;background:#003049;color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
              Intentar de nuevo →
            </a>
          </div>
        </div>
        <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} AquíTenes · Universidad Mariano Gálvez de Guatemala</p>
        </div>
      </div>
    </body>
    </html>
  `
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: correo,
        subject: `Actualización sobre tu solicitud "${nombreNegocio}" en AquíTenes`,
        html
    })
}

// ── Correo: recuperar contraseña ────────────────────────
const sendPasswordReset = async (correo, nombreUsuario, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <div style="background:#C1121F;padding:36px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;">AquíTENES</h1>
          <p style="color:rgba(255,255,255,.75);margin:8px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Recuperación de Contraseña</p>
        </div>
        <div style="padding:40px;">
          <p style="color:#003049;font-size:16px;font-weight:700;margin:0 0 8px;">Hola, ${nombreUsuario}</p>
          <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 24px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${resetUrl}" style="display:inline-block;background:#C1121F;color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
              Restablecer contraseña
            </a>
          </div>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;">
            <p style="margin:0;color:#991b1b;font-size:13px;">⚠️ Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, ignora este correo.</p>
          </div>
        </div>
        <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} AquíTenes · Universidad Mariano Gálvez de Guatemala</p>
        </div>
      </div>
    </body>
    </html>
  `
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: correo,
        subject: '🔐 Restablece tu contraseña de AquíTenes',
        html
    })
}

module.exports = { sendBusinessApproved, sendBusinessRejected, sendPasswordReset }