import mongoose from "mongoose";
import bcrpt from "bcrypt";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required!"],
      unique: true,
      trim: true,
      minlength: 3,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required!"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
      required: [true, "Password is required!"],
    },
    refreshToken: {
      type: String,
    },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    resetToken: {
      type: String,
      default: null,
      select: false,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

// HASHING PASS before save (promise-based middleware - no next() in async)
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrpt.hash(this.password, 10);
});

// COMPARE PASS before save
UserSchema.methods.comparePass = async function (inputPass) {
  return await bcrpt.compare(inputPass, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;
