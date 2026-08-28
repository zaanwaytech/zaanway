import mongoose, { Schema } from "mongoose";

const ConversationSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    whatsappAccountId: {
      type: Schema.Types.ObjectId,
      ref: "WhatsAppAccount",
      required: true,
      index: true,
    },
    customerPhone: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
      index: true,
    },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for locating conversations by phone per workspace
ConversationSchema.index({ workspaceId: 1, customerPhone: 1 });

export default mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
