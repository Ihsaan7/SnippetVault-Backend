import ApiError from "../utils/ApiError";
import AsyncHandler from "../utils/AsyncHandler";
import userModel from "../models/User.model.js";
import {
  genAccessToken,
  genRefreshToken,
} from "../services/genToken.service.js";

const registerUser = AsyncHandler(async (req, res) => {
  // Get input
  // --------------- NOTE ADD MULTER -----------
  const { email, password, username } = req.body;
  // Validate
  if ([username, password, email].some((fields) => !field.trim())) {
    throw new ApiError(400, "All fields are required!");
  }

  // Check for existing user
  const exisitingUser = await userModel.findOne({
    $or: [{ username }, { email }],
  });
  if (exisitingUser) {
    throw new ApiError(402, "User already exists!");
  }

  // Create new User
  const user = await userModel.create({
    username,
    email,
    password,
  });

  // Check for created User
  const createdUser = await userModel.findOne(user._id);
  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while creating User!",
      "REGISTER_USER_CONTROLLER"
    );
  }

  // Generate Token
  const accessToken = genAccessToken(user._id);
  const refreshToken = genRefreshToken(user._id);

  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? "None" : "Lax",
    secure: isProduction,
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
});
