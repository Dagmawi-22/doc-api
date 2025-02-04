import mongoose from "mongoose";

const DoctorWalletSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      required: true,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.DoctorWallet ||
  mongoose.model("DoctorWallet", DoctorWalletSchema);
