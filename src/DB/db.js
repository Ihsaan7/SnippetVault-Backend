import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    const connectionInstant = await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      `\nConnection to MONGODB successful: ${connectionInstant.connection.host}`
    );
    return connectionInstant.connection;
  } catch (err) {
    console.log("Error while connecting to MONGODB!", err);
    // In serverless (Vercel), do NOT kill the process.
    throw err;
  }
};

export default connectDB;
