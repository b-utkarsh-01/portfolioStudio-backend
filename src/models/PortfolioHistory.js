import mongoose from "mongoose";

const portfolioHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    portfolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Portfolio",
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      default: "Auto-saved snapshot",
      trim: true,
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ["auto", "manual", "pre-rollback"],
      default: "auto",
      index: true,
    },
    templateId: {
      type: String,
      required: true,
      default: "premium-v1",
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    changeSummary: {
      type: [String],
      default: [],
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB automatically drops documents when `expiresAt` time is reached.
// If expiresAt is null or undefined, the document is NOT deleted.
portfolioHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
portfolioHistorySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("PortfolioHistory", portfolioHistorySchema);
