import ApiError from "../utils/ApiError.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import SnippetModel from "../models/Snippet.model.js";
import ApiResponse from "../utils/ApiResponse.js";

const createSnippet = AsyncHandler(async (req, res) => {
  // Get Data and Validate
  const { title, code, codeLanguage, tags, description, isPublic } = req.body;
  if (!title || !title.trim()) {
    throw new ApiError(400, "Title is required!");
  }
  if (!code || !code.trim()) {
    throw new ApiError(400, "Code content is required!");
  }

  // Create Snippet in DB
  const snippet = await SnippetModel.create({
    title: title.trim(),
    code,
    codeLanguage: codeLanguage || "javascript",
    tags: tags || [],
    description: description || "",
    isPublic: isPublic || false,
    owner: req.user._id,
  });

  // Check for Snippet in DB
  const createdSnippet = await SnippetModel.findById(snippet._id);
  if (!createdSnippet) {
    throw new ApiError(
      500,
      "Something went wrong, While creating snippet!",
      "SNIPPET_CONTROLLER"
    );
  }

  // Return res
  return res
    .status(201)
    .json(new ApiResponse(201, snippet, "Snippet created successfully"));
});

const getSnippet = AsyncHandler(async (req, res) => {
  // Parse paging & search params safely
  const { page = 1, limit = 10, search = "", tags = "" } = req.query;
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

  const query = { owner: req.user._id };
  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    // Use case-insensitive substring match so multi-word phrases stay together
    const escaped = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const phraseRegex = new RegExp(escaped, "i");
    query.$or = [
      { title: phraseRegex },
      { description: phraseRegex },
      { tags: { $elemMatch: { $regex: phraseRegex } } },
    ];
  }

  // Tag filter support: ?tags=a,b,c -> filter snippets containing ALL provided tags
  const tagList = String(tags)
    .split(",")
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length > 0);
  if (tagList.length > 0) {
    query.tags = { $all: tagList };
  }

  // Get snippets ( limit )
  const snippets = await SnippetModel.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  // Page calculate
  const total = await SnippetModel.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limitNumber));

  // Return res
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        snippets,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
        },
      },
      "Snippet retreived successfully"
    )
  );
});

const getSnippetById = AsyncHandler(async (req, res) => {
  // Get ID from params
  const { snippetID } = req.params;

  const snippet = await SnippetModel.findById(snippetID);
  if (!snippet) {
    throw new ApiError(404, "Snippet not found!");
  }

  // Check for ownership
  if (snippet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You don't have permission to access this snippet!"
    );
  }

  // Return snippet
  return res
    .status(200)
    .json(new ApiResponse(200, snippet, "Snippet fetched successfully"));
});

const updateSnippet = AsyncHandler(async (req, res) => {
  // Get snippet form Params
  const { snippetID } = req.params;
  const snippet = await SnippetModel.findById(snippetID);
  if (!snippet) {
    throw new ApiError(404, "No snippet found!");
  }

  // Get Data
  const { title, code, codeLanguage, tags, description, isPublic } = req.body;

  // Check for ownership
  if (snippet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You don't have permission to update this snippet!"
    );
  }

  // Update only those = Provided
  if (title !== undefined) snippet.title = title.trim();
  if (code !== undefined) snippet.code = code;
  if (codeLanguage !== undefined) snippet.codeLanguage = codeLanguage;
  if (tags !== undefined) snippet.tags = tags;
  if (description !== undefined) snippet.description = description;
  if (isPublic !== undefined) snippet.isPublic = isPublic;

  await snippet.save();

  // Return res
  return res
    .status(200)
    .json(new ApiResponse(200, snippet, "Snippet updated successfully"));
});

const deleteSnippet = AsyncHandler(async (req, res) => {
  // Get Id and validate
  const { snippetID } = req.params;
  const snippet = await SnippetModel.findById(snippetID);
  if (!snippet) {
    throw new ApiError(404, "No snippet found!");
  }

  // Check for ownership
  if (snippet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You don't have permission to delete this snippet!"
    );
  }

  // Detele the snippet
  await snippet.deleteOne();

  // Return res
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Snippet deleted successfully"));
});

const getAllTags = AsyncHandler(async (req, res) => {
  const tags = await SnippetModel.distinct("tags", { owner: req.user._id });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { tags: tags.sort() }, "Tags retrieved successfully")
    );
});

const getTagStats = AsyncHandler(async (req, res) => {
  const stats = await SnippetModel.aggregate([
    { $match: { owner: req.user._id } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { stats }, "Tag statistics retrieved successfully")
    );
});

export {
  createSnippet,
  getSnippet,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  getAllTags,
  getTagStats,
};
