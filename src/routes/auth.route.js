import express from "express";
import { loginUser, registerUser } from "../controllers/auth.controller";

const router = express.Router();

router.route("/register", registerUser);
router.route("/login", loginUser);

export default router;
