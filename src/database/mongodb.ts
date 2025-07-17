import mongoose from "mongoose";
import { DB_URI, NODE_ENV } from "../config/env";

const connectToDatabase = async () => {
  try {
    if (!DB_URI) {
      throw new Error(
        "Database URI is not defined. Please check your environment variables."
      );
    }
    await mongoose.connect(DB_URI);
    console.log(`Connected to MongoDB in ${NODE_ENV} mode`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connectToDatabase;
