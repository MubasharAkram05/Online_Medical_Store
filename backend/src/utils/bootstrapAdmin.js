import { findUserByEmail, updateUserRole, updateUserVerification, createUser } from '../models/user.model.js';
import { hashPassword } from './password.js';
import { logger } from './logger.js';
import { env } from '../config/env.js';

export const ensureDefaultAdmin = async () => {
  if (!env.enableDefaultAdminBootstrap) {
    return;
  }

  const email = env.defaultAdminEmail;
  const password = env.defaultAdminPassword;

  if (!email || !password) {
    logger.warn(
      'DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD not set. Skipping default admin bootstrap.'
    );
    return;
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    if (existing.role !== 'admin') {
      await updateUserRole(existing.id, 'admin');
      logger.info({ email }, 'Existing user promoted to admin role');
    }

    if (!existing.is_verified) {
      await updateUserVerification(existing.id, true);
    }

    logger.info({ email }, 'Default admin account already exists');
    return;
  }

  const passwordHash = await hashPassword(password);
  const admin = await createUser({
    name: 'System Administrator',
    email,
    phone: null,
    passwordHash,
    role: 'admin'
  });

  await updateUserVerification(admin.id, true);

  logger.info(
    {
      email
    },
    'Default admin account created'
  );
};

