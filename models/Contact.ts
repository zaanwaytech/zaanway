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
    // Dynamic key-value store for business-defined custom contact fields
    // e.g. booking_date, booking_time, service, customer_type, order_id
    customFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of a contact in a specific workspace
ContactSchema.index({ workspaceId: 1, phone: 1 }, { unique: true });

export default mongoose.models.Contact || mongoose.model("Contact", ContactSchema);
