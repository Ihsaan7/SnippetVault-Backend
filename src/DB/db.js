import mongoose from "mongoose";

// Cache the connection/promise across serverless invocations.
const globalForMongoose = globalThis;

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    // Reuse active connection
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    // Reuse in-flight connection promise
    if (globalForMongoose.__mongoosePromise) {
      await globalForMongoose.__mongoosePromise;
      return mongoose.connection;
    }

    globalForMongoose.__mongoosePromise = mongoose
      .connect(process.env.MONGODB_URI)
      .then((conn) => {
        console.log(`\nConnection to MONGODB successful: ${conn.connection.host}`);
        return conn;
      })
      .catch((err) => {
        globalForMongoose.__mongoosePromise = null;
        throw err;
      });

    await globalForMongoose.__mongoosePromise;
    return mongoose.connection;
  } catch (err) {
    console.log("Error while connecting to MONGODB!", err);
    // In serverless (Vercel), do NOT kill the process.
    throw err;
  }
};

export default connectDB;
