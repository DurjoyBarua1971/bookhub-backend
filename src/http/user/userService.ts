import User from "./userModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/env";
import { defineError } from "../../config/helper";

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export const createUserService = async (userData: CreateUserData) => {
  const { name, email, password } = userData;

  // Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw defineError("Email already exists", 409);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 41, // Default role for user who is registering
    organization: null, // Will be updated after creation
  });

  // Assign organization id as admin id
  newUser.organization = newUser._id;
  await newUser.save();

  return newUser;
};

export const loginUserService = async (loginData: LoginUserData) => {
  const { email, password } = loginData;

  // Find user with password
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw defineError("Invalid email or password", 401);
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw defineError("Invalid email or password", 401);
  }

  // Check JWT secret
  if (!JWT_SECRET) {
    throw defineError("JWT_SECRET is not defined", 500);
  }

  // Generate token
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      organization: user.organization,
    },
    JWT_SECRET,
    {
      expiresIn: "3h",
    }
  );

  return {
    token,
    user: {
      name: user.name,
      email: user.email,
    },
  };
};
