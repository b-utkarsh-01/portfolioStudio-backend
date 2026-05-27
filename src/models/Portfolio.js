import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    templateId: {
      type: String,
      required: true,
      default: "premium-v1",
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "unlisted", "private"],
      default: "private",
      index: true,
    },
    slug: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Portfolio", portfolioSchema);
