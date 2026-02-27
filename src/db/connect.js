import mongoose from "mongoose";
import { env } from "../config/env.js";

export const connectToDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables.");
  }
  await mongoose.connect(env.mongoUri);
};
