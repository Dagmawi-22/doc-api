import mongoose from "mongoose";

const GenreSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Book || mongoose.model("Genre", GenreSchema);
