import ApiError from "../utils/ApiError.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import SnippetModel from "../models/Snippet.model.js";
import ApiResponse from "../utils/ApiResponse.js";

const enrichSnippetForUser = (snippet, userId) => {
  if (!snippet) return snippet;
  const obj = typeof snippet.toObject === "function" ? snippet.toObject() : snippet;
  const favoritedBy = Array.isArray(obj.favoritedBy) ? obj.favoritedBy : [];
  const isFavorited = userId
    ? favoritedBy.some((id) => id?.toString?.() === userId?.toString?.())
    : false;

  return {
    ...obj,
    favoriteCount: favoritedBy.length,
    isFavorited,
  };
};

const enrichSnippetPublic = (snippet) => {
  if (!snippet) return snippet;
  const obj = typeof snippet.toObject === "function" ? snippet.toObject() : snippet;
  const favoritedBy = Array.isArray(obj.favoritedBy) ? obj.favoritedBy : [];

  return {
    ...obj,
    favoriteCount: favoritedBy.length,
  };
};

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
    .json(
      new ApiResponse(
        201,
        enrichSnippetForUser(snippet, req.user._id),
        "Snippet created successfully"
      )
    );
});

const getSnippet = AsyncHandler(async (req, res) => {
  // Parse paging & search params safely
  const {
    page = 1,
    limit = 10,
    search = "",
    tags = "",
    language = "",
    from = "",
    to = "",
  } = req.query;
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

  const query = { owner: req.user._id };

  // Language filtering
  const trimmedLanguage = String(language).trim().toLowerCase();
  if (trimmedLanguage) {
    query.codeLanguage = trimmedLanguage;
  }

  // Date range filtering
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (
    (fromDate && !Number.isNaN(fromDate.getTime())) ||
    (toDate && !Number.isNaN(toDate.getTime()))
  ) {
    query.createdAt = {};
    if (fromDate && !Number.isNaN(fromDate.getTime())) query.createdAt.$gte = fromDate;
    if (toDate && !Number.isNaN(toDate.getTime())) query.createdAt.$lte = toDate;
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    // Use case-insensitive substring match so multi-word phrases stay together
    const escaped = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const phraseRegex = new RegExp(escaped, "i");
    query.$or = [
      { title: phraseRegex },
      { description: phraseRegex },
      { code: phraseRegex },
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

  const formatted = snippets.map((s) => enrichSnippetForUser(s, req.user._id));

  // Page calculate
  const total = await SnippetModel.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limitNumber));

  // Return res
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        snippets: formatted,
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
    .json(
      new ApiResponse(
        200,
        enrichSnippetForUser(snippet, req.user._id),
        "Snippet fetched successfully"
      )
    );
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
    .json(
      new ApiResponse(
        200,
        enrichSnippetForUser(snippet, req.user._id),
        "Snippet updated successfully"
      )
    );
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

const toggleFavorite = AsyncHandler(async (req, res) => {
  const { snippetID } = req.params;

  const snippet = await SnippetModel.findById(snippetID);
  if (!snippet) throw new ApiError(404, "Snippet not found!");

  const isOwner = snippet.owner?.toString?.() === req.user._id.toString();
  if (!isOwner && !snippet.isPublic) {
    throw new ApiError(403, "You don't have permission to favorite this snippet!");
  }

  const already = (snippet.favoritedBy || []).some(
    (id) => id?.toString?.() === req.user._id.toString()
  );

  if (already) {
    snippet.favoritedBy = (snippet.favoritedBy || []).filter(
      (id) => id?.toString?.() !== req.user._id.toString()
    );
  } else {
    snippet.favoritedBy = [...(snippet.favoritedBy || []), req.user._id];
  }

  await snippet.save();

  const payload = enrichSnippetForUser(snippet, req.user._id);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        snippetID: snippet._id,
        isFavorited: payload.isFavorited,
        favoriteCount: payload.favoriteCount,
      },
      "Favorite updated"
    )
  );
});

const getFavoriteSnippets = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

  const query = {
    favoritedBy: req.user._id,
    $or: [{ owner: req.user._id }, { isPublic: true }],
  };

  const snippets = await SnippetModel.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  const total = await SnippetModel.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limitNumber));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        snippets: snippets.map((s) => enrichSnippetForUser(s, req.user._id)),
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
        },
      },
      "Favorite snippets retrieved successfully"
    )
  );
});

const getPublicSnippets = AsyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    tags = "",
    language = "",
    from = "",
    to = "",
  } = req.query;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

  const query = { isPublic: true };

  const trimmedLanguage = String(language).trim().toLowerCase();
  if (trimmedLanguage) {
    query.codeLanguage = trimmedLanguage;
  }

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (
    (fromDate && !Number.isNaN(fromDate.getTime())) ||
    (toDate && !Number.isNaN(toDate.getTime()))
  ) {
    query.createdAt = {};
    if (fromDate && !Number.isNaN(fromDate.getTime())) query.createdAt.$gte = fromDate;
    if (toDate && !Number.isNaN(toDate.getTime())) query.createdAt.$lte = toDate;
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const escaped = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const phraseRegex = new RegExp(escaped, "i");
    query.$or = [
      { title: phraseRegex },
      { description: phraseRegex },
      { code: phraseRegex },
      { tags: { $elemMatch: { $regex: phraseRegex } } },
    ];
  }

  const tagList = String(tags)
    .split(",")
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length > 0);
  if (tagList.length > 0) {
    query.tags = { $all: tagList };
  }

  const snippets = await SnippetModel.find(query)
    .populate("owner", "username")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  const total = await SnippetModel.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limitNumber));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        snippets: snippets.map(enrichSnippetPublic),
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
        },
      },
      "Public snippets retrieved successfully"
    )
  );
});

const getPublicSnippetById = AsyncHandler(async (req, res) => {
  const { snippetID } = req.params;

  const snippet = await SnippetModel.findOne({ _id: snippetID, isPublic: true }).populate(
    "owner",
    "username"
  );
  if (!snippet) throw new ApiError(404, "Public snippet not found!");

  return res
    .status(200)
    .json(new ApiResponse(200, enrichSnippetPublic(snippet), "Public snippet fetched"));
});

const forkSnippet = AsyncHandler(async (req, res) => {
  const { snippetID } = req.params;

  const source = await SnippetModel.findOne({ _id: snippetID, isPublic: true });
  if (!source) throw new ApiError(404, "Public snippet not found!");

  const fork = await SnippetModel.create({
    title: source.title,
    code: source.code,
    codeLanguage: source.codeLanguage,
    tags: source.tags || [],
    description: source.description || "",
    owner: req.user._id,
    isPublic: false,
    forkedFrom: source._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, enrichSnippetForUser(fork, req.user._id), "Snippet forked"));
});

const getSnippetStats = AsyncHandler(async (req, res) => {
  const owner = req.user._id;

  const totalSnippets = await SnippetModel.countDocuments({ owner });

  const mostUsedLanguages = await SnippetModel.aggregate([
    { $match: { owner } },
    { $group: { _id: "$codeLanguage", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, language: "$_id", count: 1 } },
  ]);

  const recentActivity = await SnippetModel.find({ owner })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("title codeLanguage createdAt isPublic");

  const storageAgg = await SnippetModel.aggregate([
    { $match: { owner } },
    { $project: { len: { $strLenCP: "$code" } } },
    { $group: { _id: null, totalChars: { $sum: "$len" } } },
  ]);
  const storageUsageChars = storageAgg?.[0]?.totalChars || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSnippets,
        mostUsedLanguages,
        recentActivity,
        storageUsage: {
          unit: "chars",
          total: storageUsageChars,
        },
      },
      "Snippet statistics retrieved successfully"
    )
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
  toggleFavorite,
  getFavoriteSnippets,
  getPublicSnippets,
  getPublicSnippetById,
  forkSnippet,
  getSnippetStats,
};
