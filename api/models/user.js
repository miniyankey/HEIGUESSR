import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must be at most 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers and underscores",
      ],
    },
    firstname: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastname: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Invalid email address",
      },
    },
    hash: {
      type: String,
      required: true,
      select: false, // excluded from queries by default
    },
    /**** POUR PLUS TARD SI ON VEUT IMPLEMENTER *****/
    // isVerified: {
    //   type: Boolean,
    //   default: false, // set to true after email confirmation
    // },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON: {
      transform: (doc, ret) => {
        delete ret.hash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export default mongoose.model("User", userSchema);
