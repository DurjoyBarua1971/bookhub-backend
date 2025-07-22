import { z } from "zod";
import { Response } from "express";

export const defineError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
};

export const handleZodError = (error: z.ZodError, res: Response) => {
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
};

export const validateRequestBody = (body: any) => {
  if (!body || Object.keys(body).length === 0) {
    throw defineError("Request body cannot be empty", 400);
  }
};
