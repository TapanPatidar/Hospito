import mongoose from "mongoose";

const authorizationSchema = new mongoose.Schema(
  {
    caseNumber: { type: String, required: true, unique: true, trim: true },
    patientName: { type: String, required: true, trim: true },
    memberId: { type: String, required: true, trim: true },
    drugName: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    prescriber: { type: String, required: true, trim: true },
    payer: { type: String, required: true, trim: true },
    priority: { type: String, required: true, enum: ["Routine", "Expedited", "Urgent"] },
    status: { type: String, required: true, enum: ["Draft", "Submitted", "Pending Review", "Approved", "Denied", "Info Requested"] },
    turnaroundDate: { type: String, required: true },
    assignedTo: { type: String, required: true, trim: true },
    notes: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export const Authorization = mongoose.model("Authorization", authorizationSchema);
