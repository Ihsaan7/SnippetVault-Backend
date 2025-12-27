import jwt from "jsonwebtoken";
import crypto from "crypto";
import ApiError from "../utils/ApiError.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import userModel from "../models/User.model.js";
import {
  genAccessToken,
  genRefreshToken,
} from "../services/genToken.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadOnCloudi } from "../utils/Cloudinary.js";

// REGISTER
const registerUser = AsyncHandler(async (req, res) => {
  // Get input
  const { email, password, username, fullName } = req.body;
  // Validate
  if ([username, password, email, fullName].some((field) => !field.trim())) {
    throw new ApiError(400, "All fields are required!");
  }

  // Avatar
  const avatarFile = req.files?.avatar?.[0];
  if (!avatarFile) {
    throw new ApiError(400, "Avatar is missing!");
  }

  const avatar = await uploadOnCloudi(avatarFile.path || avatarFile);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is missing!");
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
    fullName,
    password,
    avatar: avatar.url,
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

  // Send RESPONSE (shape matches login)
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createdUser },
        "User created successfully"
      )
    );
});
// LOGIN
const loginUser = AsyncHandler(async (req, res) => {
  // Get Data from Input
  const { identifier, password } = req.body;
  if (!identifier) {
    throw new ApiError(400, "Username or Email is required!");
  }

  //Find user in DB
  const user = await userModel
    .findOne({
      $or: [
        { username: identifier.toLowerCase() },
        { email: identifier.toLowerCase() },
      ],
    })
    .select("+password");
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
// LOGOUT
const logoutUser = AsyncHandler(async (req, res) => {
  await userModel.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: "" },
    },
    {
      new: true,
    }
  );

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? "None" : "Lax",
    secure: isProduction,
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User loggedOut successfully"));
});
// PROFILE
const profileUser = AsyncHandler(async (req, res) => {
  const user = await userModel
    .findById(req.user._id)
    .select("-password -refreshToken");
  if (!user) {
    throw new ApiError(401, "User not found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile fetched successfully"));
});

// ACCESS TOKEN REFRESH
const refreshAccessToken = AsyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request!");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN
  );

  const user = await userModel.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid Refresh Token!");
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh Token has been revoked!");
  }

  const accessToken = genAccessToken(user._id);
  const newRefreshToken = genRefreshToken(user._id);
  user.refreshToken = newRefreshToken;
  await user.save();

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? "None" : "Lax",
    secure: isProduction,
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.cookie("refreshToken", newRefreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Access token refreshed successfully"));
});

// UPDATE PROFILE ( fullName / email )
const changeAccountDetails = AsyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  // 1. Validation at least one field is provided
  if (!fullName && !email) {
    throw new ApiError(400, "Please provide at least one field to update!");
  }

  // 2. If email provided, check uniqueness
  if (email) {
    const existingUser = await userModel.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.user._id },
    });
    if (existingUser) {
      throw new ApiError(400, "Email is already in use!");
    }
  }

  // 3. Only add fields which exist
  const updateFields = {};
  if (fullName) updateFields.fullName = fullName;
  if (email) updateFields.email = email.toLowerCase();

  // 4. Database Call
  const user = await userModel
    .findByIdAndUpdate(
      req.user?._id,
      {
        $set: updateFields,
      },
      { new: true }
    )
    .select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// UPDATE PASSWORD
const changeCurrentPass = AsyncHandler(async (req, res) => {
  const { oldPass, newPass, confirmPassword } = req.body;
  if (!oldPass || !newPass || !confirmPassword) {
    throw new ApiError(400, "All fields are required!");
  }

  if (newPass !== confirmPassword) {
    throw new ApiError(400, "New passwords do not match!");
  }

  const user = await userModel.findById(req.user._id).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid request!");
  }

  const correctPass = await user.comparePass(oldPass);
  if (!correctPass) {
    throw new ApiError(400, "Invalid old password!");
  }

  user.password = newPass;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// UPDATE AVATAR
const updateAvatar = AsyncHandler(async (req, res) => {
  const avatarFile = req.files?.avatar?.[0];
  if (!avatarFile) {
    throw new ApiError(400, "Avatar file is required!");
  }

  const avatar = await uploadOnCloudi(avatarFile.path || avatarFile);
  if (!avatar || !avatar.url) {
    throw new ApiError(
      500,
      "Error while uploading the Avatar!",
      "UPDATE_AVATAR_CONTROLLER"
    );
  }

  const user = await userModel
    .findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    )
    .select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

// RESET / FORGOT Password
const forgotPassword = AsyncHandler(async (req, res) => {
  const { email } = req.body;

  // Step 1 & 2: Validate email
  if (!email || !email.trim()) {
    throw new ApiError(400, "Email is required!");
  }

  // Step 3: Find user by email
  const user = await userModel.findOne({ email: email.toLowerCase() });

  // Generic response so attackers can't tell if email exists
  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "If email exists, reset link will be sent to your inbox"
        )
      );
  }

  // Step 4: Generate reset token (random 32 bytes = 64 hex characters)
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash the token for storage (safer in case DB is breached)
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Step 5: Set expiry time (15 minutes from now)
  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

  // Step 6: Save to DB
  user.resetToken = hashedToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save({ validateBeforeSave: false });

  // Step 7: Send email (for now, just log it)
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  console.log(`[PASSWORD RESET] Email: ${email}`);
  console.log(`[PASSWORD RESET] Reset URL: ${resetUrl}`);
  // TODO: Replace with nodemailer when adding email service

  // Step 8: Return success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "If email exists, reset link will be sent to your inbox"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  profileUser,
  refreshAccessToken,
  changeAccountDetails,
  changeCurrentPass,
  updateAvatar,
  forgotPassword,
};
