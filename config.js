require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  // Admin PIN to access the guest list & dashboard
  // Default is 2026. Change this in your .env file in production!
  ADMIN_PIN: process.env.ADMIN_PIN || '2026',
  // Session secret for admin cookie token
  SESSION_SECRET: process.env.SESSION_SECRET || 'birthday-movie-magic-secret-2026',
  // SQLite database file path
  DB_PATH: process.env.DB_PATH || 'rsvps.db'
};
