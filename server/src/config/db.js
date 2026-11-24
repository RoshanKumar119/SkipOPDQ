/**
 * Database connection.
 *
 * - If MONGO_URI is set, connect to that MongoDB instance.
 * - Otherwise start an in-memory MongoDB (mongodb-memory-server) so the demo
 *   runs on any laptop without installing MongoDB. The caller seeds it.
 */
const mongoose = require('mongoose');

let memoryServer = null;

async function connectDB() {
  let uri = process.env.MONGO_URI && process.env.MONGO_URI.trim();
  let inMemory = false;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('[db] MONGO_URI not set – starting in-memory MongoDB (first run downloads the binary, please wait)...');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('skipopdq');
    inMemory = true;
  }

  await mongoose.connect(uri);
  console.log(`[db] Connected to MongoDB ${inMemory ? '(in-memory)' : ''}`);
  return { inMemory };
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
