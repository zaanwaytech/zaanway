import mongoose, { Schema } from "mongoose";

const TemplateSchema = new Schema(
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
      lowercase: true, // Meta template names are lowercase
    },
    language: {
      type: String,
      default: "en",
      trim: true,
    },
    category: {
      type: String,
      enum: ["MARKETING", "UTILITY", "AUTHENTICATION"],
      required: true,
    },
    header: {
      format: {
        type: String,
        enum: ["TEXT", "IMAGE", "VIDEO", "DOCUMENT", "NONE"],
        default: "NONE",
      },
      text: String,
    },
    body: {
      type: String,
      required: true,
    },
    footer: {
      type: String,
    },
    buttons: [
      {
        type: {
          type: String,
          enum: ["PHONE_NUMBER", "URL", "QUICK_REPLY"],
        },
        text: String,
        phoneNumber: String,
        url: String,
      },
    ],
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"],
      default: "DRAFT",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Template names must be unique per workspace
TemplateSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export default mongoose.models.Template || mongoose.model("Template", TemplateSchema);
