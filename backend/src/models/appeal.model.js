import mongoose from "mongoose";

const appealSchema = new mongoose.Schema(
  {
    caseNumber: { type: String, required: true, trim: true },
    payer: { type: String, required: true, trim: true },
    appealLevel: { type: String, required: true, enum: ["Level 1", "Level 2", "External Review"] },
    reason: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    dueDate: { type: String, required: true },
    status: { type: String, required: true, enum: ["Drafting", "Submitted", "Awaiting Response", "Resolved"] }
  },
  { timestamps: true }
);

export const Appeal = mongoose.model("Appeal", appealSchema);
