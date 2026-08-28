import mongoose, { Schema } from "mongoose";

const ContactSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
    },
    source: {
      type: String,
      default: "WhatsApp",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of a contact in a specific workspace
ContactSchema.index({ workspaceId: 1, phone: 1 }, { unique: true });

export default mongoose.models.Contact || mongoose.model("Contact", ContactSchema);
