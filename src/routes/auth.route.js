import express from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
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

export default router;
