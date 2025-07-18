import { NextFunction, Request, Response } from "express";
import { bookCreateSchema } from "./bookValidation";
import { defineError } from "../../config/helper";
import z from "zod";

export const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("Received request to create book");
  console.log(req.files);
  try {
    req.body = JSON.parse(req.body.data || "{}");
    if (!req.body || Object.keys(req.body).length === 0) {
      throw defineError("Request body cannot be empty", 400);
    }

    const parsedData = bookCreateSchema.parse(req.body);

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: parsedData,
    });

    const {} = parsedData;
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
