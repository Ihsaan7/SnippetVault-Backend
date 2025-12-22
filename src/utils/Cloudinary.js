import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ApiError from "./ApiError.js";

const cloudConfig = {
  cloud_name: process.env.CLOUDI_NAME,
  api_key: process.env.CLOUDI_API_KEY,
  api_secret: process.env.CLOUDI_API_SECRET,
};

cloudinary.config(cloudConfig);

export const uploadOnCloudi = async (filePath) => {
  // Fast fail if env is missing
  const missing = Object.entries(cloudConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    throw new ApiError(
      500,
      `Cloudinary env missing: ${missing.join(", ")}`,
      "BACKEND_CLOUD_CONFIG"
    );
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "users",
    });
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return result;
  } catch (err) {
    console.error("Cloudinary upload error", {
      message: err?.message,
      name: err?.name,
      code: err?.http_code,
      response: err?.response?.body,
    });
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new ApiError(
      400,
      "Cloudinary Upload failed!",
      "BACKEND_CLOUD_CONFIG"
    );
  }
};
