import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    workspaceName: { type: String, required: true },
    adminName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    region: { type: String, required: true },
    alerts: { type: Boolean, default: true },
    slaHours: { type: Number, default: 24 }
  },
  { timestamps: true }
);

export const Setting = mongoose.model("Setting", settingSchema);
