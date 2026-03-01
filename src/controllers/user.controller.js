import User from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const saveFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, "token required");

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  const already = user.fcmTokens.includes(token);
  if (!already) user.fcmTokens.push(token);

  // keep tokens unique
  user.fcmTokens = [...new Set(user.fcmTokens)];
  await user.save();

  res.json({ success: true, fcmTokens: user.fcmTokens });
});