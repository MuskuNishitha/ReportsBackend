import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema(
  { url: String, type: { type: String, default: "image" } },
  { _id: false }
);

const HistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["PENDING", "APPROVED", "CHANGES", "REJECTED"] },
    comment: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { _id: false }
);

const ReportSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    timeSpent: { type: Number, default: 0 }, // minutes
    attachments: { type: [AttachmentSchema], default: [] },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "CHANGES", "REJECTED"],
      default: "PENDING"
    },
    managerComment: { type: String, default: "" },
    history: { type: [HistorySchema], default: [] }
  },
  { timestamps: true }
);

ReportSchema.index({ employeeId: 1, date: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Report", ReportSchema);