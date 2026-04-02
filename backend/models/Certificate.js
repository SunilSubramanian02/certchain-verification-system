import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  certificateId: {
    type: String,
    unique: true
  }
});

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;