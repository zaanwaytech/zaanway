import mongoose, { Schema } from "mongoose";

const WhatsAppAccountSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true,
      index: true,
    },
    wabaId: {
      type: String,
      required: true,
      index: true,
    },
    phoneNumberId: {
      type: String,
      required: true,
      index: true,
    },
    displayPhoneNumber: {
      type: String,
      required: true,
    },
    verifiedName: {
      type: String,
      default: "",
    },
    businessName: {
      type: String,
      default: "",
    },
    accessTokenEncrypted: {
      type: String,
      required: true,
    },
    tokenType: {
      type: String,
      default: "Bearer",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["connected", "disconnected", "error"],
      default: "connected",
      index: true,
    },
    webhookStatus: {
      type: String,
      enum: ["active", "pending", "error"],
      default: "active",
    },
    lastError: {
      type: String,
      default: null,
    },
    qualityRating: {
      type: String,
      default: "UNKNOWN",
    },
    messagingLimit: {
      type: String,
      default: "TIER_1K",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure fast multi-tenant lookup by phoneNumberId
WhatsAppAccountSchema.index({ phoneNumberId: 1, workspaceId: 1 });

export default mongoose.models.WhatsAppAccount || mongoose.model("WhatsAppAccount", WhatsAppAccountSchema);
