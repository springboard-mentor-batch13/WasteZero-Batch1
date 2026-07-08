require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./config/logger');

const requiredEnvVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'NODE_ENV'];
const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
  logger.warn('JWT_SECRET is still set to default value. Change it in production.');
}

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  logger.error('Failed to start server:', error.message);
  process.exit(1);
});
