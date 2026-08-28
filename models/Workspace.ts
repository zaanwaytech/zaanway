import mongoose, { Schema } from "mongoose";

const WorkspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["Free", "Starter", "Professional", "Business"],
      default: "Free",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Workspace || mongoose.model("Workspace", WorkspaceSchema);
