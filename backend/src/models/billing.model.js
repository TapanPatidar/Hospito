import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    patient: { type: String, required: true },
    service: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    date: { type: String, required: true }
  },
  { timestamps: true }
);

export const Billing = mongoose.model("Billing", billingSchema);
