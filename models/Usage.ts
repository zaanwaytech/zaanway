import mongoose, { Schema } from "mongoose";

const UsageSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    month: {
      type: String, // format YYYY-MM
      required: true,
      index: true,
    },
    conversationsCount: {
      type: Number,
      default: 0,
    },
    automationsExecutedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

UsageSchema.index({ workspaceId: 1, month: 1 }, { unique: true });

export default mongoose.models.Usage || mongoose.model("Usage", UsageSchema);
