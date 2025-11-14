import {
  findUserByEmail,
  findUserByPhone,
  findUserById,
  createUser,
  updateUserPassword,
  updateUserProfile
} from '../models/user.model.js';
import {
  createPasswordResetToken,
  findValidResetToken,
  markTokenUsed
} from '../models/passwordResetToken.model.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { generateResetToken, hashToken } from '../utils/token.js';
import { logger } from '../utils/logger.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const allowedRoles = ['patient', 'doctor', 'pharmacist', 'admin'];
    const normalizedRole = allowedRoles.includes(role) ? role : 'patient';

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        error: {
          message: 'Email already registered'
        }
      });
    }

    const existingPhone = await findUserByPhone(phone);
    if (existingPhone) {
      return res.status(409).json({
        error: {
          message: 'Phone number already registered'
        }
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      name,
      email,
      phone,
      passwordHash,
      role: normalizedRole
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: Boolean(user.is_verified)
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password'
        }
      });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password'
        }
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: Boolean(user.is_verified)
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a reset link has been sent.'
      });
    }

    const { token, tokenHash } = generateResetToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt
    });

    const resetLink = `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    logger.info(
      { email: user.email, resetLink },
      'Password reset link generated'
    );

    res.json({
      message: 'If an account with that email exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' ? { resetToken: token } : {})
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const tokenHash = hashToken(token);
    const resetToken = await findValidResetToken(tokenHash);

    if (!resetToken) {
      return res.status(400).json({
        error: {
          message: 'Invalid or expired reset token'
        }
      });
    }

    const passwordHash = await hashPassword(password);
    await updateUserPassword(resetToken.user_id, passwordHash);
    await markTokenUsed(resetToken.id);

    res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: Boolean(user.is_verified),
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    if (email !== user.email) {
      const emailOwner = await findUserByEmail(email);
      if (emailOwner && emailOwner.id !== user.id) {
        return res.status(409).json({
          error: {
            message: 'Email is already in use'
          }
        });
      }
    }

    if (phone && phone !== user.phone) {
      const phoneOwner = await findUserByPhone(phone);
      if (phoneOwner && phoneOwner.id !== user.id) {
        return res.status(409).json({
          error: {
            message: 'Phone number is already in use'
          }
        });
      }
    }

    await updateUserProfile(user.id, { name, email, phone });

    res.json({
      user: {
        id: user.id,
        name,
        email,
        phone,
        role: user.role,
        isVerified: Boolean(user.is_verified)
      },
      message: 'Profile updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    const isValid = await comparePassword(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({
        error: {
          message: 'Current password is incorrect'
        }
      });
    }

    const passwordHash = await hashPassword(newPassword);
    await updateUserPassword(user.id, passwordHash);

    res.json({
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

