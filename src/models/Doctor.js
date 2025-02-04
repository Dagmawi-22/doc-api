import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: false },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    specialization: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    experience: { type: Number, required: true },
    availability: { type: String, required: true },

    // Verification status
    verified: { type: Boolean, default: false },

    // Wallet Relation
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorWallet",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);
