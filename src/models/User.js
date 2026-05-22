import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    hasPremiumAccess: {
      type: Boolean,
      default: false,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
        userAgent: { type: String, default: "" },
        ip: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
