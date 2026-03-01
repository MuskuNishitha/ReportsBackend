import Report from "../models/Report.js";
import User from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendPushToTokens } from "../utils/sendPush.js";

export const createReport = asyncHandler(async (req, res) => {
  const { title, description, date, timeSpent = 0, attachments = [] } = req.body;
  if (!title || !description || !date) throw new ApiError(400, "title, description, date required");

  const report = await Report.create({
    employeeId: req.user._id,
    title,
    description,
    date,
    timeSpent,
    attachments,
    status: "PENDING",
    history: [
      { status: "PENDING", comment: "Submitted", updatedBy: req.user._id, updatedAt: new Date() }
    ]
  });

  // notify all managers
  const managers = await User.find({ role: "MANAGER" }).select("fcmTokens name");
  const tokens = managers.flatMap((m) => m.fcmTokens || []);

  await sendPushToTokens({
    tokens,
    title: "New report submitted",
    body: `${req.user.name} submitted a report (${date})`,
    data: { reportId: report._id }
  });

  res.status(201).json({ success: true, report });
});

export const listReports = asyncHandler(async (req, res) => {
  const { status, date, employeeId } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (date) filter.date = date;

  // employee can only see own reports
  if (req.user.role === "EMPLOYEE") {
    filter.employeeId = req.user._id;
  } else {
    // manager can filter by employeeId
    if (employeeId) filter.employeeId = employeeId;
  }

  const reports = await Report.find(filter)
    .populate("employeeId", "name role")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: reports.length, reports });
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate("employeeId", "name role");
  if (!report) throw new ApiError(404, "Report not found");

  // employee can only open own report
  if (req.user.role === "EMPLOYEE" && String(report.employeeId._id) !== String(req.user._id)) {
    throw new ApiError(403, "Forbidden");
  }

  res.json({ success: true, report });
});

export const updateReport = asyncHandler(async (req, res) => {
  // employee can edit only own report (usually when CHANGES)
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  if (req.user.role !== "EMPLOYEE") throw new ApiError(403, "Only employee can edit");
  if (String(report.employeeId) !== String(req.user._id)) throw new ApiError(403, "Forbidden");

  const { title, description, timeSpent, attachments } = req.body;

  if (title !== undefined) report.title = title;
  if (description !== undefined) report.description = description;
  if (timeSpent !== undefined) report.timeSpent = timeSpent;
  if (attachments !== undefined) report.attachments = attachments;

  // resubmit -> pending
  report.status = "PENDING";
  report.managerComment = "";

  report.history.push({
    status: "PENDING",
    comment: "Resubmitted",
    updatedBy: req.user._id,
    updatedAt: new Date()
  });

  await report.save();

  // notify managers again
  const managers = await User.find({ role: "MANAGER" }).select("fcmTokens");
  const tokens = managers.flatMap((m) => m.fcmTokens || []);

  await sendPushToTokens({
    tokens,
    title: "Report updated",
    body: `${req.user.name} updated a report (${report.date})`,
    data: { reportId: report._id }
  });

  res.json({ success: true, report });
});

export const updateStatus = asyncHandler(async (req, res) => {
  // manager updates status + comment
  if (req.user.role !== "MANAGER") throw new ApiError(403, "Only manager can update status");

  const { status, comment = "" } = req.body;
  if (!["APPROVED", "CHANGES", "REJECTED"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  report.status = status;
  report.managerComment = comment;

  report.history.push({
    status,
    comment,
    updatedBy: req.user._id,
    updatedAt: new Date()
  });

  await report.save();

  // notify employee
  const employee = await User.findById(report.employeeId).select("fcmTokens name");
  const tokens = employee?.fcmTokens || [];

  const title =
    status === "APPROVED" ? "Report approved ✅" : status === "CHANGES" ? "Changes requested ✏️" : "Report rejected ❌";

  await sendPushToTokens({
    tokens,
    title,
    body: comment ? comment : "Tap to view details",
    data: { reportId: report._id }
  });

  res.json({ success: true, report });
});