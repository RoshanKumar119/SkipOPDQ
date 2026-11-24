/**
 * Socket.IO real-time layer.
 *
 * Rooms
 *   queue:<doctorId>:<YYYY-MM-DD>  – patients tracking that doctor's queue + the doctor
 *   hospital                       – admin dashboard, Find Doctors list, doctor details
 *
 * Events (server -> client)
 *   queue:updated          – full queue snapshot (no patient names) with per-token waiting times
 *   doctor:statusChanged   – doctor view (status, delay, note, today's sessions, queue summary)
 *
 * Events (client -> server)
 *   queue:join / queue:leave   { doctorId, date? }
 *   hospital:join / hospital:leave
 *
 * Snapshots contain no personal data, so rooms do not require authentication.
 * TODO: Phase 2 – authenticate sockets with the JWT for private, per-patient push events.
 */
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { getQueueSnapshot, getDoctorView } = require('../utils/queueSnapshot');
const { todayStr } = require('../utils/date');

let io = null;

const queueRoom = (doctorId, date) => `queue:${doctorId}:${date}`;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function initSocket(server, clientUrl) {
  io = new Server(server, { cors: { origin: clientUrl, credentials: true } });

  io.on('connection', (socket) => {
    socket.on('queue:join', async ({ doctorId, date } = {}) => {
      if (!mongoose.isValidObjectId(doctorId)) return;
      const day = DATE_RE.test(date || '') ? date : todayStr();
      socket.join(queueRoom(doctorId, day));
      // Send the current state immediately so the client is in sync after (re)connecting
      try {
        const snapshot = await getQueueSnapshot(doctorId, day);
        if (snapshot) socket.emit('queue:updated', snapshot);
      } catch (err) {
        console.error('[socket] queue:join failed', err.message);
      }
    });

    socket.on('queue:leave', ({ doctorId, date } = {}) => {
      if (!doctorId) return;
      socket.leave(queueRoom(doctorId, DATE_RE.test(date || '') ? date : todayStr()));
    });

    socket.on('hospital:join', () => socket.join('hospital'));
    socket.on('hospital:leave', () => socket.leave('hospital'));
  });

  return io;
}

/**
 * Recalculate the queue (waiting times etc.) and push it to everyone watching
 * that doctor's queue and to the hospital-wide room.
 */
async function broadcastQueue(doctorId, date = todayStr()) {
  if (!io) return;
  const snapshot = await getQueueSnapshot(doctorId, date);
  if (!snapshot) return;
  io.to(queueRoom(String(doctorId), date)).to('hospital').emit('queue:updated', snapshot);
}

/** Push a doctor's new live status, then the recalculated queue. */
async function broadcastDoctorStatus(doctorId) {
  if (!io) return;
  const view = await getDoctorView(doctorId);
  if (!view) return;
  io.to(queueRoom(String(doctorId), todayStr())).to('hospital').emit('doctor:statusChanged', view);
  await broadcastQueue(doctorId);
}

/** Fire-and-forget wrapper so a socket error never breaks an HTTP response. */
const safe = (fn) => (...args) => fn(...args).catch((err) => console.error('[socket] broadcast failed:', err.message));

module.exports = {
  initSocket,
  broadcastQueue: safe(broadcastQueue),
  broadcastDoctorStatus: safe(broadcastDoctorStatus),
  queueRoom,
};
