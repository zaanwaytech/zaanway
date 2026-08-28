import mongoose, { Schema } from "mongoose";

const WorkspaceMemberSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["Owner", "Admin", "Agent"],
      default: "Agent",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee a user has a single role representation in a workspace
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export default mongoose.models.WorkspaceMember || mongoose.model("WorkspaceMember", WorkspaceMemberSchema);
