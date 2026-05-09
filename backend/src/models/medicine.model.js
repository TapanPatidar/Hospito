import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    price: { type: Number, required: true },
    supplier: { type: String, required: true },
    expiry: { type: String, required: true }
  },
  { timestamps: true }
);

export const Medicine = mongoose.model("Medicine", medicineSchema);
