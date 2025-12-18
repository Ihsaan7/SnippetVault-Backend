import express from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";
import verifyJWT from "../middlewares/auth.mware.js";

const router = express.Router();

router.get("/jwtTest", verifyJWT, (req, res) => {
  res.json({ message: "You are authenticated", user: req.user });
});

router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;
