import { NextFunction, Request, Response } from "express";
import { bookCreateSchema, bookUpdateSchema } from "./bookValidation";
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
      organization: _req.user?.organization,
    });

    // we don't send the organization field in the response
    newBook.organization = undefined;

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

export const updateBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookId = req.params.id;

    const _req = req as AuthRequest;
    const organization = _req.user?.organization;

    const book = await Book.findOne({ _id: bookId, organization });

    if (!book) {
      throw defineError("Book not found", 404);
    }

    req.body = JSON.parse(req.body.data || "{}");

    const parsedData = bookUpdateSchema.parse(req.body);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let coverImageUrl = "";

    if (files.image && files.image.length > 0) {
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

      coverImageUrl = uploadResult.secure_url;
      await fs.promises.unlink(filePath);

      // Remove the old cover image
      if (book.coverImageUrl) {
        const publicId = book.coverImageUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(`Book Covers/${publicId}`);
          } catch (error) {
            console.error("Error deleting old cover image:", error);
          }
        }
      }
    }

    const updateBook = await Book.findByIdAndUpdate(
      {
        _id: bookId,
        organization,
      },
      {
        ...parsedData,
        coverImageUrl: coverImageUrl || book.coverImageUrl,
      },
      {
        new: true,
      }
    );

    if (!updateBook) {
      throw defineError("Failed to update book", 500);
    }

    // we don't send the organization field in the response
    updateBook.organization = undefined;

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updateBook,
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

export const deleteBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const organization = _req.user?.organization;

    const bookId = req.params.id;
    const book = await Book.findOne({ _id: bookId, organization });
    if (!book) {
      throw defineError("Book not found", 404);
    }

    // Remove the cover image from Cloudinary
    if (book.coverImageUrl) {
      const publicId = book.coverImageUrl.split("/").pop()?.split(".")[0];
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`Book Covers/${publicId}`);
        } catch (error) {
          console.error("Error deleting cover image:", error);
        }
      }
    }

    await Book.deleteOne({ _id: bookId });

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
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

export const getBooks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const organization = _req.user?.organization;

    const { title, genre, author, minPrice, maxPrice, inStock } = req.query;

    const query: any = { organization };

    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    if (genre) {
      query.genre = genre;
    }

    if (author) {
      query.author = { $regex: author, $options: "i" };
    }

    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    if (inStock !== undefined) {
      query.quantity = inStock === "true" ? { $gt: 0 } : 0;
    }

    const page = Number(req.query.page) || 1;
    const limit = 10;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const books = await Book.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-organization")
      .populate("addedBy", "name");

    const total = await Book.countDocuments(query);

    res.status(200).json({
      success: true,
      data: books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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

export const getBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.id;
  const _req = req as AuthRequest;
  const organization = _req.user?.organization;

  const book = await Book.findOne({ _id: bookId, organization })
    .select("-organization")
    .populate("addedBy", "name");

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Book not found",
    });
  }

  res.status(200).json({
    success: true,
    data: book,
  });
};
