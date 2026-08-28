import mongoose, { Schema } from "mongoose";

const AutomationSchema = new Schema(
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
    trigger: {
      type: {
        type: String,
        enum: ["incoming_message", "keyword", "button_clicked", "list_selected", "new_contact", "tag_added"],
        required: true,
      },
      keyword: {
        type: String,
        lowercase: true,
        trim: true,
      },
    },
    actions: [
      {
        type: {
          type: String,
          enum: [
            "send_text",
            "send_image",
            "send_video",
            "send_document",
            "send_template",
            "send_interactive_buttons",
            "send_interactive_list",
            "add_tag",
            "remove_tag",
            "assign_agent",
            "wait",
          ],
          required: true,
        },
        payload: {
          type: Schema.Types.Mixed,
        },
      },
    ],
    // For storing React Flow state (nodes, edges) in later phases
    flowData: {
      type: Schema.Types.Mixed,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Automation || mongoose.model("Automation", AutomationSchema);
