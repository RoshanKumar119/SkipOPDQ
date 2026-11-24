/**
 * SkipOPDQ server entry point.
 * Express REST API + Socket.IO real-time queue updates + MongoDB.
 */
require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');
const { initSocket } = require('./socket');
const { HOSPITAL } = require('./config/constants');
const { errorHandler } = require('./utils/errors');
const { seedDatabase } = require('./seed/seed');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'skipopdq-dev-secret';
  console.warn('[config] JWT_SECRET not set – using a development default. Set it in server/.env for production.');
}

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Health check + hospital info
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get('/api/meta', (req, res) => res.json({ hospital: HOSPITAL, version: '0.6.0', phase: 'MVP (Phase 1)' }));

// REST routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/schedules', require('./routes/schedule.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/queue', require('./routes/queue.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Phase 2 placeholders (respond 501 Not Implemented Yet)
app.use('/api', require('./routes/phase2.routes'));

// 404 for unknown API routes + central error handler
app.use('/api', (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server, CLIENT_URL);

async function start() {
  const { inMemory } = await connectDB();

  // In-memory DB starts empty -> always seed fresh demo data (dated today).
  // A real MongoDB is seeded only if it has no users yet (use `npm run seed` to reset).
  if (inMemory || (await User.estimatedDocumentCount()) === 0) {
    await seedDatabase();
  }

  server.listen(PORT, () => console.log(`[server] SkipOPDQ API running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
