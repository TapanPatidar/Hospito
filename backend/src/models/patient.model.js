import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true },
    condition: { type: String, required: true },
    status: { type: String, required: true }
  },
  { timestamps: true }
);

export const Patient = mongoose.model("Patient", patientSchema);
