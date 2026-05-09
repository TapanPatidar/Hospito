import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    payer: { type: String, required: true, trim: true },
    policyName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    reviewDate: { type: String, required: true },
    status: { type: String, required: true, enum: ["Active", "Needs Review", "Archived"] },
    summary: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export const Policy = mongoose.model("Policy", policySchema);
