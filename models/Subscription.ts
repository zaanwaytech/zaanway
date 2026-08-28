import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["Free", "Starter", "Professional", "Business"],
      default: "Free",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "trialing", "cancelled", "past_due"],
      default: "trialing",
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days trial
    },
    limits: {
      whatsappNumbersCount: { type: Number, default: 1 },
      conversationsLimit: { type: Number, default: 500 },
      agentsLimit: { type: Number, default: 1 },
      automationsLimit: { type: Number, default: 5 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);
