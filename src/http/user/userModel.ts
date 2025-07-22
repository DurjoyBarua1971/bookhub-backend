import mongoose from "mongoose";
import { User } from "./userTypes";

const userSchema = new mongoose.Schema<User>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [10, "Name must not exceed 10 characters"],
    },
    email: {
      type: String,
      unique: [true, "Email already exists"],
      required: [true, "Email is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: Number,
      required: [true, "Role is required"],
      enum: [41, 109], // 41 for admin, 109 for moderator
      default: 41, // Default role for admin
    },
    organization: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model<User>("User", userSchema);

export default User;