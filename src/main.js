import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./DB/db.js";

dotenv.config();

connectDB().catch((err) => {
  console.log("Error while Connection to MONGODB!!!", err);
});

if (process.env.NODE_ENV !== "production") {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running at PORT : ${process.env.PORT}`);
  });
}

// Export for Vercel serverless
// export default app;