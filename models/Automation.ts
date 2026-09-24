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
    description: {
      type: String,
      default: "",
    },
    trigger: {
      type: {
        type: String,
        enum: [
          "incoming_message",
          "keyword",
          "button_reply",
          "list_reply",
          "conversation_started",
          "new_contact",
          "tag_added",
        ],
        required: true,
      },
      matching: {
        type: String,
        enum: ["exact", "contains"],
        default: "exact",
      },
      keyword: {
        type: String,
        lowercase: true,
        trim: true,
      },
      buttonId: {
        type: String,
        trim: true,
      },
      listRowId: {
        type: String,
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
            "condition",
            "update_contact_field",
            "add_tag",
            "remove_tag",
            "assign_agent",
            "wait",
            "call_webhook",
            "end_automation",
          ],
          required: true,
        },
        payload: {
          type: Schema.Types.Mixed,
        },
      },
    ],
    // For storing visual flow builder graph data
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

AutomationSchema.index({ workspaceId: 1, isActive: 1 });

export default mongoose.models.Automation || mongoose.model("Automation", AutomationSchema);
