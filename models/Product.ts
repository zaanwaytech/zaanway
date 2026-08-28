import mongoose, { Schema } from "mongoose";

const ProductSchema = new Schema(
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
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    images: [
      {
        type: String, // URLs to S3 storage
      },
    ],
    available: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for category filtering within a workspace
ProductSchema.index({ workspaceId: 1, category: 1 });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
