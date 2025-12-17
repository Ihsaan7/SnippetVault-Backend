import ApiError from "../utils/ApiError";
import AsyncHandler from "../utils/AsyncHandler";
import userModel from "../models/User.model.js";
import { genAccessToken } from "../services/genToken.service.js";

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
    throw new ApiError(500, "Something went wrong while creating User!");
  }
  // Generate Token
  const accessToken = genAccessToken();
});
