/**
 * Token number allocation: next number per doctor per day.
 * A unique index on (doctor, date, tokenNumber) guarantees no duplicates; if two
 * bookings race for the same number, the loser simply retries with the next one.
 */
const Appointment = require('../models/Appointment');
const { ApiError } = require('./errors');

async function createWithNextToken(data, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const last = await Appointment.findOne({ doctor: data.doctor, date: data.date })
      .sort({ tokenNumber: -1 })
      .select('tokenNumber')
      .lean();
    try {
      return await Appointment.create({ ...data, tokenNumber: (last?.tokenNumber || 0) + 1 });
    } catch (err) {
      if (err.code !== 11000) throw err; // only retry on duplicate token
    }
  }
  throw new ApiError(503, 'The queue is very busy right now, please try again');
}

module.exports = { createWithNextToken };
