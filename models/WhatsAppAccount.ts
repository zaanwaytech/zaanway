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
    },
    phoneNumberId: {
      type: String,
      required: true,
    },
    displayPhoneNumber: {
      type: String,
      required: true,
    },
    accessTokenEncrypted: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["connected", "disconnected", "error"],
      default: "disconnected",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.WhatsAppAccount || mongoose.model("WhatsAppAccount", WhatsAppAccountSchema);
