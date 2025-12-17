import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstant = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`
                    \n Connection to MONGODB successfull: ${connectionInstant.connection.host}
                `);
  } catch (err) {
    console.log("Error while connecting to MONGODB!", err);
    process.exit(1);
  }
};

export default connectDB;
