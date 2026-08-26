import mongoose, { Schema } from "mongoose";

const TurfSettingsSchema = new Schema(
  {
    turfName: { type: String, default: "ABC Turf" },
    openTime: { type: String, default: "06:00" }, // 24h format HH:MM
    closeTime: { type: String, default: "22:00" }, // 24h format HH:MM
    welcomeMessage: { type: String, default: "Welcome to ABC Turf! ⚽🏏" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.TurfSettings ||
  mongoose.model("TurfSettings", TurfSettingsSchema);
