import pino from 'pino';
import pretty from 'pino-pretty';
import { env } from '../config/env.js';

const stream = pretty({
  colorize: true,
  translateTime: 'SYS:standard'
});

export const logger = pino(
  {
    name: env.appName,
    level: process.env.LOG_LEVEL || 'info'
  },
  stream
);

