import { Timestamp } from "bson";
import mongoose from "mongoose";

const SnippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required!"],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, "Code content is required!"],
    },
    codeLanguage: {
      type: String,
      required: true,
      default: "javascript",
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

//Compound Indexing
SnippetSchema.index({ title: "text", tags: "text" });

const Snippet = mongoose.model("Snippet", SnippetSchema);
export default Snippet;
