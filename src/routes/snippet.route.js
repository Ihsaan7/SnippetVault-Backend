import { Router } from "express";
import {
  createSnippet,
  getSnippet,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
} from "../controllers/snippet.controller.js";
import verifyJWT from "../middlewares/auth.mware.js";

const router = Router();

// Protected routes - All snippet operations require authentication
router.post("/create", verifyJWT, createSnippet);
router.get("/", verifyJWT, getSnippet);
router.get("/:snippetID", verifyJWT, getSnippetById);
router.put("/:snippetID", verifyJWT, updateSnippet);
router.delete("/:snippetID", verifyJWT, deleteSnippet);

export default router;
