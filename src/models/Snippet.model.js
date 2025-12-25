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
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.length <= 10;
        },
        message: "A snippet can have max 10 tags!",
      },
    },
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
SnippetSchema.index({ tags: 1 });

// Mongoose v9 middleware uses promise/async style — no `next` callback
SnippetSchema.pre("save", function () {
  if (this.tags) {
    this.tags = [
      ...new Set(
        this.tags
          .map((tag) => tag.toLowerCase().trim())
          .filter((tag) => tag.length > 0)
      ),
    ];
  }
});

const Snippet = mongoose.model("Snippet", SnippetSchema);
export default Snippet;
