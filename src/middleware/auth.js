import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) throw new ApiError(401, "Not authorized");

  const token = auth.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select("-passwordHash");
  if (!user) throw new ApiError(401, "User not found");

  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, "Not authorized"));
  if (!roles.includes(req.user.role)) return next(new ApiError(403, "Forbidden"));
  next();
};