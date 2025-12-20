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
  // Get first 10 Search
  const { page = 1, limit = 10, search = "" } = req.query;
  const query = { owner: req.user._id };
  if (search) {
    query.$text = { $search: search };
  }

  // Get snippets ( limit )
  const snippets = await SnippetModel.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Page calculate
  const total = await SnippetModel.countDocuments(query);

  // Return res
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        snippets,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
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

export {
  createSnippet,
  getSnippet,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
};
