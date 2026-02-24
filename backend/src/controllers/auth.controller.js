import {
  findUserByEmail,
  findUserByPhone,
  findUserById,
  createUser,
  updateUserPassword,
  updateUserProfile,
  updateProfilePic,
  deleteProfilePic
} from '../models/user.model.js';
import {
  createPasswordResetToken,
  findValidResetToken,
  markTokenUsed
} from '../models/passwordResetToken.model.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { generateResetToken, hashToken } from '../utils/token.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { env } from '../config/env.js';

const buildFileUrl = (req, filePath) => {
  return `${req.protocol}://${req.get('host')}/uploads/${filePath.replace(/\\/g, '/')}`;
};

const buildAuthPayload = (user) => ({
  sub: user.id,
  email: user.email,
  role: user.role
});

const buildAuthResponse = (user, includeRefreshToken = true) => {
  const payload = buildAuthPayload(user);
  const accessToken = generateAccessToken(payload);
  const response = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePic: user.profile_pic,
      isVerified: Boolean(user.is_verified)
    },
    tokens: {
      accessToken
    }
  };

  if (includeRefreshToken) {
    response.tokens.refreshToken = generateRefreshToken(payload);
  }

  return response;
};

export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const allowedSignupRoles = ['patient', 'doctor', 'pharmacist'];
    const normalizedRole = allowedSignupRoles.includes(role) ? role : 'patient';

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

    res.status(201).json(buildAuthResponse(user));
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

    res.json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
};

export const refreshSession = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: {
          message: 'Refresh token is required'
        }
      });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired refresh token'
        }
      });
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Session is no longer valid'
        }
      });
    }

    res.json(buildAuthResponse(user));
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

    const resetLink = `${env.frontendUrl}/reset-password?token=${token}`;

    // Send the actual email
    await sendPasswordResetEmail(user.email, resetLink);

    res.json({
      message: 'If an account with that email exists, a reset link has been sent.',
      ...(env.nodeEnv !== 'production' ? { resetToken: token } : {})
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
        profilePic: user.profile_pic,
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
        profilePic: user.profile_pic,
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

export const updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'Please upload an image' } });
    }

    const imageUrl = buildFileUrl(req, `profiles/${req.file.filename}`);
    await updateProfilePic(req.user.id, imageUrl);

    res.json({
      profilePic: imageUrl,
      message: 'Profile picture updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProfilePicture = async (req, res, next) => {
  try {
    await deleteProfilePic(req.user.id);
    res.json({
      message: 'Profile picture removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

