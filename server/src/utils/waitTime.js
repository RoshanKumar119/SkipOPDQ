/**
 * Waiting-time calculation for an OPD queue.
 *
 *   Estimated waiting time = (patients ahead × avgConsultationMinutes) + delayMinutes
 *
 * - "Patients ahead" = waiting tokens with a lower number + the patient currently
 *   in consultation (they still occupy the doctor).
 * - If the OPD session has not started yet, the countdown starts from the
 *   session start time instead of "now".
 * - If the doctor is unavailable, no time estimate is given (null).
 */
const { todayAt, timeToMinutes } = require('./date');
const { ARRIVAL_BUFFER_MINUTES } = require('../config/constants');

/**
 * Work out from when the doctor will start seeing patients.
 * @param {Array<{startTime:string,endTime:string}>} sessionsToday
 * @param {Date} now
 */
function queueStartTime(sessionsToday = [], now = new Date()) {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const sorted = [...sessionsToday].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  // Currently inside a session -> now
  if (sorted.some((s) => timeToMinutes(s.startTime) <= nowMins && nowMins < timeToMinutes(s.endTime))) return now;
  // Next session later today -> its start time
  const next = sorted.find((s) => timeToMinutes(s.startTime) > nowMins);
  return next ? todayAt(next.startTime, now) : now;
}

/**
 * Pure function: given a doctor and that day's appointments, return the queue
 * state with a per-token waiting estimate.
 */
function calculateQueue(doctor, appointments, sessionsToday = [], now = new Date()) {
  const sorted = [...appointments].sort((a, b) => a.tokenNumber - b.tokenNumber);
  const current = sorted.find((a) => a.status === 'in-consultation') || null;
  const waiting = sorted.filter((a) => a.status === 'waiting');
  const isUnavailable = doctor.status === 'unavailable';
  const avg = doctor.avgConsultationMinutes || 10;
  const delay = doctor.delayMinutes || 0;
  const start = queueStartTime(sessionsToday, now);

  const counts = { total: 0, waiting: 0, inConsultation: 0, completed: 0, skipped: 0, cancelled: 0 };
  sorted.forEach((a) => {
    if (a.status !== 'cancelled') counts.total += 1;
    const key = a.status === 'in-consultation' ? 'inConsultation' : a.status;
    counts[key] += 1;
  });

  const waitingIndex = new Map(waiting.map((a, i) => [String(a._id), i]));

  const tokens = sorted.map((a) => {
    const base = {
      appointmentId: String(a._id),
      tokenNumber: a.tokenNumber,
      status: a.status,
      source: a.source,
      patientsAhead: null,
      estimatedWaitMinutes: null,
      expectedAt: null,
      reachBy: null,
    };

    if (a.status === 'in-consultation') return { ...base, patientsAhead: 0, estimatedWaitMinutes: 0 };
    if (a.status !== 'waiting') return base;

    const ahead = waitingIndex.get(String(a._id)) + (current ? 1 : 0);
    if (isUnavailable) return { ...base, patientsAhead: ahead };

    const wait = ahead * avg + delay;
    const expectedAt = new Date(start.getTime() + wait * 60000);
    // Suggest arriving a little before the expected time, but never in the past
    const reachBy = new Date(Math.max(now.getTime(), expectedAt.getTime() - ARRIVAL_BUFFER_MINUTES * 60000));
    // Countdown shown to the patient includes any gap until the OPD session starts
    const totalWait = Math.round((expectedAt.getTime() - now.getTime()) / 60000);

    return {
      ...base,
      patientsAhead: ahead,
      estimatedWaitMinutes: Math.max(0, totalWait),
      expectedAt: expectedAt.toISOString(),
      reachBy: reachBy.toISOString(),
    };
  });

  return {
    nowServing: current ? current.tokenNumber : null,
    nowServingId: current ? String(current._id) : null,
    nextToken: waiting[0] ? waiting[0].tokenNumber : null,
    lastToken: sorted.length ? sorted[sorted.length - 1].tokenNumber : 0,
    counts,
    tokens,
    queueStartsAt: start.toISOString(),
  };
}

module.exports = { calculateQueue, queueStartTime };
