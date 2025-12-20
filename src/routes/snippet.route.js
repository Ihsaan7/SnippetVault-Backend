import { Router } from "express";
import {
  createSnippet,
  getSnippet,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
} from "../controllers/snippet.controller.js";
import { verifyJWT } from "../middlewares/auth.mware.js";

const router = Router();

// Protected routes - All snippet operations require authentication
router.post("/create", verifyJWT, createSnippet);
router.get("/", verifyJWT, getSnippet);
router.get("/:id", verifyJWT, getSnippetById);
router.put("/:id", verifyJWT, updateSnippet);
router.delete("/:id", verifyJWT, deleteSnippet);

export default router;
