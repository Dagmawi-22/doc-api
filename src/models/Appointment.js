import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // Example: "10:30 AM"
    duration: { type: Number, required: true }, // Duration in minutes
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    reason: { type: String, required: true }, // Reason for appointment
    notes: { type: String }, // Doctor's notes after the appointment

    // Payment details
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Credit Card", "Insurance", "Mobile Payment"],
      required: function () {
        return this.paymentStatus === "Paid";
      },
    },
    amount: { type: Number, required: true },
    transactionId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.models.Appointment ||
  mongoose.model("Appointment", AppointmentSchema);
