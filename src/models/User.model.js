import mongoose from "mongoose";
import bcrpt from "bcrypt";

const UserSchema = new mongooseSchema(
  {
    username: {
      type: String,
      required: [true, "Username is required!"],
      unique: true,
      trim: true,
      minlength:3
    },
    emial: {
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
    avatar:{
        type:String,
        default:"https://cdn-icons-png.flaticon.com/512/149/149071.png"
    }
  },
  { collection: "users" },
  { timestamp: true }
);

// HASHING PASS before save
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrpt.hash(this.password, 10);
  next();
});

// COMPARE PASS before save
UserSchema.methods.comparePass = async function (inputPass) {
  return await bcrpt.compare(inputPass, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;
