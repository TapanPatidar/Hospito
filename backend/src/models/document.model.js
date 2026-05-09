import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true },
    caseNumber: { type: String, required: true, trim: true },
    patientName: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["Clinical Note", "Lab Result", "Denial Letter", "Prescription", "Insurance Card"] },
    status: { type: String, required: true, enum: ["Received", "Indexed", "Pending QA"] },
    uploadedBy: { type: String, required: true, trim: true },
    receivedDate: { type: String, required: true }
  },
  { timestamps: true }
);

export const Document = mongoose.model("Document", documentSchema);
