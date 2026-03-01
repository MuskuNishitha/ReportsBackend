import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw new ApiError(400, "identifier and password required");

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }]
  });

  if (!user) throw new ApiError(401, "Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const token = signToken(user._id);

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      mobile: user.mobile
    }
  });
});

// (Only for first time setup) Create user
export const register = asyncHandler(async (req, res) => {
  const { name, role, email, mobile, password } = req.body;
  if (!name || !role || !password) throw new ApiError(400, "name, role, password required");

  const exists = await User.findOne({
    $or: [
      ...(email ? [{ email: email.toLowerCase() }] : []),
      ...(mobile ? [{ mobile }] : [])
    ]
  });

  if (exists) throw new ApiError(409, "User already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    role,
    email: email?.toLowerCase(),
    mobile,
    passwordHash
  });

  res.status(201).json({
    success: true,
    user: { id: user._id, name: user.name, role: user.role, email: user.email, mobile: user.mobile }
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});