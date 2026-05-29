const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendPasswordReset } = require('../utils/EmailService');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nombre, apellido, correo, password, nombre_usuario } = req.body;
    const id_rol = 4;

    // nombre_usuario is required for manual registration
    if (!nombre_usuario) {
      return res.status(400).json({ error: 'Registration failed', message: 'El nombre de usuario es requerido' });
    }

    // Check if username is taken
    const existingUsername = await User.findByUsername(nombre_usuario);
    if (existingUsername) {
      return res.status(409).json({ error: 'Registration failed', message: 'El nombre de usuario ya está en uso' });
    }

    // Check email uniqueness only if provided
    if (correo) {
      const existingUser = await User.findByEmail(correo);
      if (existingUser) {
        return res.status(409).json({ error: 'Registration failed', message: 'El correo ya está registrado' });
      }
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      nombre,
      apellido,
      correo,
      password_hash,
      nombre_usuario: nombre_usuario || null,
      id_rol,
      activo: 1
    };

    const newUser = await User.create(userData);
    const token = generateToken(newUser.id_usuario);

    // Return user without password
    const userResponse = await User.findById(newUser.id_usuario);
    delete userResponse.password_hash;

    logger.info(`User registered: ${correo}`, { ip: req.ip });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error'
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { identifier, password } = req.body;

    // Find user by email or username
    const user = await User.findByIdentifier(identifier);
    if (!user) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Credenciales inválidas'
      });
    }

    // Check if user is active
    if (!user.activo) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Account is deactivated'
      });
    }

    // Check if user is blocked
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Account is temporarily blocked'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Increment failed attempts
      const attempts = (user.intentos_fallidos || 0) + 1;
      await User.updateFailedAttempts(user.id_usuario, attempts);

      // Block user after 5 failed attempts
      if (attempts >= 5) {
        const blockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await User.blockUser(user.id_usuario, blockUntil);

        logger.warn(`User blocked due to failed attempts: ${identifier}`, {
          ip: req.ip,
          attempts
        });

        return res.status(401).json({
          error: 'Login failed',
          message: 'Account temporarily blocked due to multiple failed attempts'
        });
      }

      return res.status(401).json({
        error: 'Login failed',
        message: 'Credenciales inválidas'
      });
    }

    // Reset failed attempts on successful login
    if (user.intentos_fallidos > 0) {
      await User.updateFailedAttempts(user.id_usuario, 0);
    }

    // Generate token
    const token = generateToken(user.id_usuario);

    // Remove password from response
    delete user.password_hash;

    logger.info(`User logged in: ${identifier}`, { ip: req.ip });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error'
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' });
    }

    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Invalid Google access token' });
    }

    const { email, given_name, family_name } = await googleRes.json();

    // Check if user exists
    let user = await User.findByEmail(email);

    if (!user) {
      // Create user if they don't exist
      const userData = {
        nombre: given_name || 'Usuario',
        apellido: family_name || 'Google',
        correo: email,
        password_hash: 'GOOGLE_AUTH_ACCOUNT',
        id_rol: 4, // Default: Visitante
        activo: 1
      };

      const newUserResult = await User.create(userData);
      user = await User.findById(newUserResult.id_usuario);
      logger.info(`New user created via Google: ${email}`);
    } else if (!user.activo) {
      return res.status(401).json({ error: 'Login failed', message: 'Account is deactivated' });
    }

    // Generate our app's JWT
    const token = generateToken(user.id_usuario);
    delete user.password_hash;

    logger.info(`User logged in via Google: ${email}`, { ip: req.ip });

    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    logger.error('Google login error:', error);
    res.status(500).json({
      error: 'Google login failed',
      message: 'Internal server error during Google authentication'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id_usuario);
    delete user.password_hash;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'Internal server error'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nombre, apellido, foto_perfil } = req.body;
    const updateData = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (apellido !== undefined) updateData.apellido = apellido;
    if (foto_perfil !== undefined) updateData.foto_perfil = foto_perfil;

    const updatedUser = await User.update(req.user.id_usuario, updateData);
    delete updatedUser.password_hash;

    logger.info(`Profile updated: ${req.user.correo}`, { ip: req.ip });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'Internal server error'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user
    const user = await User.findById(req.user.id_usuario);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Password change failed',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.update(req.user.id_usuario, { password_hash: newPasswordHash });

    logger.info(`Password changed: ${req.user.correo}`, { ip: req.ip });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: 'Internal server error'
    });
  }
};

// ── Recuperar contraseña ────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.status(400).json({ error: 'El correo es requerido' });
    }

    const user = await User.findByEmail(correo);

    // Siempre responder igual para no revelar si el correo existe
    if (!user) {
      return res.json({ success: true, message: 'Si el correo existe, recibirás un enlace de recuperación.' });
    }

    // Generar token de reset (expira en 1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await User.update(user.id_usuario, {
      reset_token: resetToken,
      reset_token_expires: resetExpires
    });

    await sendPasswordReset(user.correo, user.nombre, resetToken);

    logger.info(`Password reset requested: ${correo}`, { ip: req.ip });

    res.json({ success: true, message: 'Si el correo existe, recibirás un enlace de recuperación.' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

// ── Resetear contraseña con token ───────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    if (newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'
      });
    }

    const user = await User.findByResetToken(token);

    if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado' });
    }

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await User.update(user.id_usuario, {
      password_hash,
      reset_token: null,
      reset_token_expires: null
    });

    logger.info(`Password reset completed: ${user.correo}`, { ip: req.ip });

    res.json({ success: true, message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  validateRegister: [
    body('nombre').trim().isLength({ min: 2, max: 50 }).withMessage('Nombre debe tener entre 2 y 50 caracteres'),
    body('apellido').trim().isLength({ min: 2, max: 50 }).withMessage('Apellido debe tener entre 2 y 50 caracteres'),
    body('nombre_usuario')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('El usuario debe tener entre 3 y 30 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Solo letras, números y guión bajo (_)'),
    body('correo')
      .optional({ checkFalsy: true })
      .isEmail()
      .normalizeEmail()
      .withMessage('Correo inválido'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula, y un número')
  ],
  validateLogin: [
    body('identifier')
      .notEmpty()
      .withMessage('Ingresa tu correo o nombre de usuario'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validateUpdateProfile: [
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nombre must be between 2 and 50 characters'),
    body('apellido')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Apellido must be between 2 and 50 characters'),
    body('foto_perfil')
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage('foto_perfil must be a valid URL')
  ],
  validateChangePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New La contraseña debe contener al menos una letra mayúscula, una minúscula, y un número')
  ]
};