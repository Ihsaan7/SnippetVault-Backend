import express from "express";
import {
  changeAccountDetails,
  changeCurrentPass,
  loginUser,
  logoutUser,
  profileUser,
  refreshAccessToken,
  registerUser,
  updateAvatar,
} from "../controllers/auth.controller.js";
import verifyJWT from "../middlewares/auth.mware.js";
import { upload } from "../middlewares/multer.mware.js";

const router = express.Router();

router.get("/jwtTest", verifyJWT, (req, res) => {
  res.json({ message: "You are authenticated", user: req.user });
});

router.post(
  "/register",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  registerUser
);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);

router.get("/profile", verifyJWT, profileUser);

router.post("/refresh", refreshAccessToken);

router.patch("/update-profile", verifyJWT, changeAccountDetails);

router.patch("/update-password", verifyJWT, changeCurrentPass);

router.patch(
  "/update-avatar",
  verifyJWT,
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  updateAvatar
);

export default router;
