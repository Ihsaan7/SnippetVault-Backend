import jwt from "jsonwebtoken";
import AsyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import userModel from "../models/User.model.js";
import {
  genAccessToken,
  genRefreshToken,
} from "../services/genToken.service.js";

const verifyJWT = AsyncHandler(async (req, res, next) => {
  // Get token
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(404, "Unauthorized Access!", "JWT_VERIFY");
  }

  // Verify Token
  const decodeToken = await jwt.verify(token, process.env.ACCESS_TOKEN);
  // Fetch User
  const user = await userModel
    .findById(decodeToken._id)
    .select("-refreshToken  -password");
  // Validate User
  if (!user) {
    throw new ApiError(404, "Unauthorized Access!", "JWT_VERIFY");
  }

  req.user = user;
  next();
});

export default verifyJWT;
