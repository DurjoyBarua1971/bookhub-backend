import { NextFunction, Request, Response } from "express";
import User from "./userModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/env";
import { userLoginSchema, userRegisterSchema } from "./userValidation";
import { z } from "zod";
import { defineError } from "../../config/helper";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ✅ Check if the body is an empty object
    if (!req.body || Object.keys(req.body).length === 0) {
      throw defineError("Request body cannot be empty", 400);
    }

    // ✅ Validate with Zod
    const parsedData = userRegisterSchema.parse(req.body);
    const { name, email, password } = parsedData;

    // ✅ Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw defineError("Email already exists", 409);
    }

    // ✅ Hash password and save user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const { password: fk, ...userResponse } = newUser.toObject();

    // ✅ Success response
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.reduce((acc, issue) => {
        const field = issue.path[0] as string;
        acc[field] = issue.message;
        return acc;
      }, {} as Record<string, string>);

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw defineError("Request body cannot be empty", 400);
    }

    const parsedData = userLoginSchema.parse(req.body);
    const { email, password } = parsedData;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw defineError("Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw defineError("Invalid email or password", 401);
    }

    if (!JWT_SECRET) {
      throw defineError("JWT_SECRET is not defined", 500);
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.reduce((acc, issue) => {
        const field = issue.path[0] as string;
        acc[field] = issue.message;
        return acc;
      }, {} as Record<string, string>);

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
    }
    next(error);
  }
};
