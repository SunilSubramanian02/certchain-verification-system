import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  candidateName: { type: String, required: true },
  course: { type: String, required: true },
  certificateId: { type: String, required: true, unique: true },
  pdfHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Certificate", certificateSchema);