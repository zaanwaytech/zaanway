import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: String,

    email: String,

    whatsappConnected: {
      type: Boolean,
      default: false,
    },

    phoneNumberId: String,

    wabaId: String,

    businessId: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);