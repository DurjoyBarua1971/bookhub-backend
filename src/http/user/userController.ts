import { NextFunction, Request, Response } from "express";
import User from "./userModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/env";
import { userRegisterSchema } from "./userValidation";
import { z } from "zod";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ✅ Check if the body is an empty object
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body cannot be empty",
      });
    }

    // ✅ Validate with Zod
    const parsedData = userRegisterSchema.parse(req.body);
    const { name, email, password } = parsedData;

    // ✅ Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // ✅ Hash password and save user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const { password:fk, ...userResponse } = newUser.toObject();


    // ✅ Success response
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    // ✅ Zod error handling
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

    // ✅ Let global error handler handle unexpected errors
    next(error);
  }
};


export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required") as Error & {
        statusCode?: number;
      };
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      const error = new Error("Invalid email or password") as Error & {
        statusCode?: number;
      };
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid email or password") as Error & {
        statusCode?: number;
      };
      error.statusCode = 401;
      throw error;
    }

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
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
      data: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};
