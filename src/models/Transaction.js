import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const TransactionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    amount: { type: Number, required: true }, // Payment amount
    currency: { type: String, default: "USD" }, // Currency type
    paymentMethod: {
      type: String,
      enum: ["Cash", "Credit Card", "Insurance", "Mobile Payment"],
      required: true,
    },
    transactionId: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    paymentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
