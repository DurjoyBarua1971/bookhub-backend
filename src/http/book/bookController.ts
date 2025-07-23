import { NextFunction, Request, Response } from "express";
import { bookCreateSchema, bookUpdateSchema } from "./bookValidation";
import { validateRequestBody, handleZodError } from "../../config/helper";
import z from "zod";
import cloudinary from "../../config/cloudinary";
import path from "node:path";
import fs from "node:fs";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  createBookService,
  updateBookService,
  deleteBookService,
  getBooksService,
  getBookService,
  getDashboardStatsService,
} from "./bookService";

export const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.body = JSON.parse(req.body.data || "{}");
    validateRequestBody(req.body);

    const parsedData = bookCreateSchema.parse(req.body);

    // Handle file upload
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files.image || files.image.length === 0) {
      throw new Error("Image file is required");
    }

    const coverImageFormat = files.image[0].mimetype.split("/")[1];
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

    const newBook = await createBookService({
      ...parsedData,
      coverImageUrl: uploadResult.secure_url,
      addedBy: _req.user!.id,
      organization: _req.user!.organization!,
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
      return handleZodError(error, res);
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
    const organization = _req.user!.organization!;

    req.body = JSON.parse(req.body.data || "{}");
    const parsedData = bookUpdateSchema.parse(req.body);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let coverImageUrl = "";

    // Handle image upload if provided
    if (files.image && files.image.length > 0) {
      const coverImageFormat = files.image[0].mimetype.split("/")[1];
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
    }

    const updateData = coverImageUrl
      ? { ...parsedData, coverImageUrl }
      : parsedData;

    const { updatedBook, oldBook } = await updateBookService(
      bookId,
      organization,
      updateData
    );

    // Remove old cover image if new one was uploaded
    if (coverImageUrl && oldBook.coverImageUrl) {
      const publicId = oldBook.coverImageUrl.split("/").pop()?.split(".")[0];
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`Book Covers/${publicId}`);
        } catch (error) {
          console.error("Error deleting old cover image:", error);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, res);
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
    const organization = _req.user!.organization!;
    const bookId = req.params.id;

    const book = await deleteBookService(bookId, organization);

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

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
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
    const organization = _req.user!.organization!;

    const { title, genre, author, minPrice, maxPrice, inStock } = req.query;

    const filters = {
      organization,
      title: title as string,
      genre: genre as string,
      author: author as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStock !== undefined ? inStock === "true" : undefined,
    };

    const pagination = {
      page: Number(req.query.page) || 1,
      limit: 10,
    };

    const result = await getBooksService(filters, pagination);

    res.status(200).json({
      success: true,
      data: result.books,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookId = req.params.id;
    const _req = req as AuthRequest;
    const organization = _req.user!.organization!;

    const book = await getBookService(bookId, organization);

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const organization = _req.user!.organization!;
    const stats = await getDashboardStatsService(organization);

    res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
