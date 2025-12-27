import jwt from "jsonwebtoken";
import AsyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import userModel from "../models/User.model.js";
import {
  genAccessToken,
  genRefreshToken,
} from "../services/genToken.service.js";

const verifyJWT = AsyncHandler(async (req, res, next) => {
  // Get token (prefer Authorization header for cross-domain deployments like Vercel)
  const token =
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.cookies?.accessToken;
  if (!token) {
    throw new ApiError(401, "Unauthorized Access!", "JWT_VERIFY");
  }

  // Verify Token
  let decodeToken;
  try {
    decodeToken = await jwt.verify(token, process.env.ACCESS_TOKEN);
  } catch {
    throw new ApiError(401, "Unauthorized Access!", "JWT_VERIFY");
  }
  // Fetch User
  const user = await userModel
    .findById(decodeToken._id)
    .select("-refreshToken  -password");
  // Validate User
  if (!user) {
    throw new ApiError(401, "Unauthorized Access!", "JWT_VERIFY");
  }

  req.user = user;
  next();
});

export default verifyJWT;
