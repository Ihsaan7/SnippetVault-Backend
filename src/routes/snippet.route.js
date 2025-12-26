import { Router } from "express";
import {
  createSnippet,
  getSnippet,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  getAllTags,
  getTagStats,
  toggleFavorite,
  getFavoriteSnippets,
  getPublicSnippets,
  getPublicSnippetById,
  forkSnippet,
  getSnippetStats,
} from "../controllers/snippet.controller.js";
import verifyJWT from "../middlewares/auth.mware.js";

const router = Router();

// Public routes
router.get("/public", getPublicSnippets);
router.get("/public/:snippetID", getPublicSnippetById);

// Protected routes - All snippet operations require authentication
router.post("/create", verifyJWT, createSnippet);
router.get("/", verifyJWT, getSnippet);
router.get("/favorites", verifyJWT, getFavoriteSnippets);
router.get("/stats", verifyJWT, getSnippetStats);
router.get("/tags", verifyJWT, getAllTags);
router.get("/tags/stats", verifyJWT, getTagStats);
router.post("/:snippetID/favorite", verifyJWT, toggleFavorite);
router.post("/:snippetID/fork", verifyJWT, forkSnippet);
router.get("/:snippetID", verifyJWT, getSnippetById);
router.put("/:snippetID", verifyJWT, updateSnippet);
router.delete("/:snippetID", verifyJWT, deleteSnippet);

export default router;
