import mongoose, { Schema } from "mongoose";

const KeywordSchema = new Schema(
  {
    userId: String,
    keyword: String,
    reply: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Keyword ||
mongoose.model("Keyword", KeywordSchema);