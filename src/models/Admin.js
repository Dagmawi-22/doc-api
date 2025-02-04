const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    address: { type: String, required: false },
  },
  { timestamps: true }
);

export default mongoose.models.Patient || mongoose.model("Admin", AdminSchema);
