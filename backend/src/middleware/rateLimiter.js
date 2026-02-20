import rateLimit from 'express-rate-limit';

/**
 * Standard rate limiter for API routes
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        error: {
            message: 'Too many requests from this IP, please try again after 15 minutes'
        }
    }
});

/**
 * Strict rate limiter for authentication routes (login, register, reset password)
 */
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 authentication requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            message: 'Too many authentication attempts, please try again after an hour'
        }
    }
});

/**
 * Very strict limiter for password reset requests to prevent spam
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            message: 'Too many password reset requests, please try again after an hour'
        }
    }
});
