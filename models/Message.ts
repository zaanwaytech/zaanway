import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    userId: String,

    from: String,

    message: String,

    reply: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);