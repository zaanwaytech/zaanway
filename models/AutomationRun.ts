import mongoose, { Schema } from "mongoose";

const AutomationRunSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    automationId: {
      type: Schema.Types.ObjectId,
      ref: "Automation",
      required: true,
      index: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      index: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    triggerValue: {
      type: String,
    },
    status: {
      type: String,
      enum: ["success", "failed", "running", "skipped"],
      default: "success",
      index: true,
    },
    stepsExecuted: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

AutomationRunSchema.index({ workspaceId: 1, createdAt: -1 });

export default mongoose.models.AutomationRun || mongoose.model("AutomationRun", AutomationRunSchema);
