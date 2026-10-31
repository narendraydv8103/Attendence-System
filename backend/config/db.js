const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected (Remote/Local): ${conn.connection.host}`);
    } else {
      console.log('No MONGODB_URI found. Starting MongoDB Memory Server for instant zero-config execution...');
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`MongoDB Connected (Memory Server): ${conn.connection.host}`);
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Attempting fallback to MongoDB Memory Server...');
    try {
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`MongoDB Connected (Memory Fallback): ${conn.connection.host}`);
    } catch (memError) {
      console.error(`Memory DB Failed: ${memError.message}`);
      console.warn('Continuing server startup without database. Set MONGODB_URI to connect to MongoDB.');
    }
  }
};

module.exports = connectDB;
