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
    time: { type: String, required: true },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Scheduled", "Started", "Completed", "Skipped"],
      default: "Scheduled",
    },
    reason: { type: String, required: true },
    notes: { type: String },
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
    minutesTaken: { type: Number, min: 0 },
    response: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Appointment ||
  mongoose.model("Appointment", AppointmentSchema);

  // dummy
