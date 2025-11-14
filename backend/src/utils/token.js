import crypto from 'crypto';

export const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  return { token, tokenHash };
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

