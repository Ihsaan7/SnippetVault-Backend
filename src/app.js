import express from "express";
import cookieParser from "cookie-parser";
import ApiError from "./utils/ApiError.js";
import AsyncHandler from "./utils/AsyncHandler.js";
import ApiResponse from "./utils/ApiResponse.js";
import ErrorHandler from "./middlewares/errorHandler.mware.js";
import authRoute from "./routes/auth.route.js";
import snippetRoute from "./routes/snippet.route.js";
import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
];
const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ----------------- Test Route -----------------------
app.get("/health", (req, res) => {
  res.json({ message: "Server is Alive!" });
});

// -----------------Auth Route-------------------
app.use("/api/v1/auth", authRoute);

// -----------------Snippet Route-------------------
app.use("/api/v1/snippets", snippetRoute);

// ----------------- 404 Route -----------------------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found!" });
});
// ----------------- Centeralized Error Route -----------------------
app.use(ErrorHandler);

export default app;
