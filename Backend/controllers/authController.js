const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');

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

    const { nombre, apellido, correo, password } = req.body;
    const id_rol = 4; // Always Visitante — role changes happen via admin or business approval

    // Check if user already exists
    const existingUser = await User.findByEmail(correo);
    if (existingUser) {
      return res.status(409).json({
        error: 'Registration failed',
        message: 'Email already registered'
      });
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

    const { correo, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(correo);
    if (!user) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Invalid credentials'
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

        logger.warn(`User blocked due to failed attempts: ${correo}`, {
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
        message: 'Invalid credentials'
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

    logger.info(`User logged in: ${correo}`, { ip: req.ip });

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

module.exports = {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  changePassword,
  validateRegister: [
    body('nombre')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nombre must be between 2 and 50 characters'),
    body('apellido')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Apellido must be between 2 and 50 characters'),
    body('correo')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula, y un número')
  ],
  validateLogin: [
    body('correo')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
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
