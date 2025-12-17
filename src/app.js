import express from "express";
import ApiError from "./utils/ApiError.js";
import AsyncHandler from "./utils/AsyncHandler.js";
import ApiResponse from "./utils/ApiResponse.js";
import ErrorHandler from "./middlewares/errorHandler.mware.js";

const app = express();

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));

// ----------------- Test Route -----------------------
app.get("/health", (req, res) => {
  res.json({ message: "Server is Alive!" });
});

// ----------------- 404 Route -----------------------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found!" });
});
// ----------------- Centeralized Error Route -----------------------
app.use(ErrorHandler);

export default app;
