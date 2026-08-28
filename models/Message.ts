import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ["incoming", "outgoing"],
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "interactive", "template"],
      default: "text",
    },
    text: {
      type: String,
    },
    media: {
      url: String,
      mimeType: String,
      filename: String,
    },
    whatsappMessageId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["sending", "sent", "delivered", "read", "failed"],
      default: "sending",
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for pagination and dashboard metrics
MessageSchema.index({ workspaceId: 1, conversationId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);