import ApiError from "../utils/ApiError";
import AsyncHandler from "../utils/AsyncHandler";
import userModel from "../models/User.model.js";
import {
  genAccessToken,
  genRefreshToken,
} from "../services/genToken.service.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = AsyncHandler(async (req, res) => {
  // Get input
  // --------------- NOTE ADD MULTER -----------
  const { email, password, username } = req.body;
  // Validate
  if ([username, password, email].some((field) => !field.trim())) {
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
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
  });

  // Fetch User without Pass
  const createdUser = await userModel
    .findById(user._id)
    .select("-refreshToken -password");

  // Check for created User
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

  // Save R-token in DB
  user.refreshToken = refreshToken;
  await user.save();

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

  // Send RESPONSE
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const loginUser = AsyncHandler(async (req, res) => {
  // Get Data from Input
  const { identifier, password } = req.body;
  if (!identifier) {
    throw new ApiError(400, "Username or Email is required!");
  }

  //Find user in DB
  const user = await userModel.findOne({
    $or: [
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() },
    ],
  });
  if (!user) {
    throw new ApiError(404, "Invalid credentials!");
  }

  //Check for pass
  const validPass = await user.comparePass(password);
  if (!validPass) {
    throw new ApiError(401, "Invalid credentials");
  }

  //Generate Token
  const accessToken = genAccessToken(user._id);
  const refreshToken = genRefreshToken(user._id);

  // Update RefreshToken in DB
  user.refreshToken = refreshToken;
  await user.save();

  // Setting up Cookies
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

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: { _id: user._id, username: user.username, email: user.email } },
        "User LoggedIn successfully"
      )
    );
});

export { registerUser, loginUser };
