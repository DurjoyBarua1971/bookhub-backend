import { NextFunction, Request, Response } from "express";
import { bookCreateSchema } from "./bookValidation";
import { defineError } from "../../config/helper";
import z from "zod";
import cloudinary from "../../config/cloudinary";
import path from "node:path";
import fs from "node:fs";
import Book from "./bookModel";
import { AuthRequest } from "../../middleware/auth.middleware";

export const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.body = JSON.parse(req.body.data || "{}");
    if (!req.body || Object.keys(req.body).length === 0) {
      throw defineError("Request body cannot be empty", 400);
    }

    const parsedData = bookCreateSchema.parse(req.body);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files.image || files.image.length === 0) {
      throw defineError("Image file is required", 400);
    }
    const coverImageFormat = files.image[0].mimetype.split("/")[-1];
    const fileName = files.image[0].filename;
    const filePath = path.resolve(
      __dirname,
      "../../../public/uploads",
      fileName
    );

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "Book Covers",
      format: coverImageFormat,
    });

    const _req = req as AuthRequest;

    const newBook = await Book.create({
      ...parsedData,
      coverImageUrl: uploadResult.secure_url,
      addedBy: _req.user?.id,
    });

    // Delete the local file after upload
    await fs.promises.unlink(filePath);

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: newBook,
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
