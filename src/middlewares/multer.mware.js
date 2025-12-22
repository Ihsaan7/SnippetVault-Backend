import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const ok = /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype);
  if (ok) return cb(null, true);
  cb(new Error("Only image files are allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
