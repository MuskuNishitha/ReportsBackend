import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["EMPLOYEE", "MANAGER"], required: true },
    email: { type: String, trim: true, lowercase: true },
    mobile: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    fcmTokens: { type: [String], default: [] },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 });
UserSchema.index({ mobile: 1 });

export default mongoose.model("User", UserSchema);
