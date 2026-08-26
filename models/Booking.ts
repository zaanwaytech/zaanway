import mongoose, { Schema } from "mongoose";

const BookingSchema = new Schema(
  {
    customerPhone: { type: String, required: true },
    customerName: { type: String },
    date: { type: String, required: true }, // YYYY-MM-DD
    timeSlot: { type: String, required: true }, // e.g. "06:00 AM - 07:00 AM"
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
