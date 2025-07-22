import { z } from "zod";

export const bookCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title is required")
      .max(100, "Title must not exceed 100 characters"),
    genre: z.enum(
      ["Fiction", "Non-Fiction"],
      "Genre must be either 'Fiction' or 'Non-Fiction'"
    ),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must not exceed 500 characters"),
    authorName: z
      .string()
      .trim()
      .min(3, "Author name must be at least 3 characters")
      .max(50, "Author name must not exceed 50 characters"),
    sellingPrice: z.number().min(0, "Selling price must be a positive number"),
    buyingPrice: z.number().min(0, "Buying price must be a positive number"),
    discountPrice: z
      .number()
      .min(0, "Discount price must be a positive number if provided")
      .optional(),
    discountStartDate: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    discountEndDate: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional()
    ),
    quantity: z.number().min(0, "Quantity must be a non-negative number"),
  })
  .refine(
    (data) => {
      const hasAny =
        data.discountPrice !== undefined ||
        data.discountStartDate !== undefined ||
        data.discountEndDate !== undefined;
      const hasAll =
        data.discountPrice !== undefined &&
        data.discountStartDate !== undefined &&
        data.discountEndDate !== undefined;
      return !hasAny || hasAll;
    },
    {
      message:
        "If any of discountPrice, discountStartDate, or discountEndDate is provided, all three must be provided.",
      path: ["discountPrice"],
    }
  )
  .refine(
    (data) => {
      if (!data.discountStartDate && !data.discountEndDate) return true;
      if (!data.discountStartDate || !data.discountEndDate) return false;
      return data.discountStartDate <= data.discountEndDate;
    },
    {
      message:
        "Discount start date must be before or equal to discount end date",
      path: ["discountStartDate"],
    }
  );

export const bookUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title is required")
      .max(100, "Title must not exceed 100 characters")
      .optional(),
    genre: z
      .enum(
        ["Fiction", "Non-Fiction"],
        "Genre must be either 'Fiction' or 'Non-Fiction'"
      )
      .optional(),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must not exceed 500 characters")
      .optional(),
    authorName: z
      .string()
      .trim()
      .min(3, "Author name must be at least 3 characters")
      .max(50, "Author name must not exceed 50 characters")
      .optional(),
    sellingPrice: z
      .number()
      .min(0, "Selling price must be a positive number")
      .optional(),
    buyingPrice: z
      .number()
      .min(0, "Buying price must be a positive number")
      .optional(),
    discountPrice: z
      .number()
      .min(0, "Discount price must be a positive number if provided")
      .optional(),
    discountStartDate: z
      .preprocess(
        (val) => (val ? new Date(val as string) : undefined),
        z.date().optional()
      )
      .optional(),
    discountEndDate: z
      .preprocess(
        (val) => (val ? new Date(val as string) : undefined),
        z.date().optional()
      )
      .optional(),
    quantity: z
      .number()
      .min(0, "Quantity must be a non-negative number")
      .optional(),
  })
  .refine(
    (data) => {
      const hasAny =
        data.discountPrice !== undefined ||
        data.discountStartDate !== undefined ||
        data.discountEndDate !== undefined;
      const hasAll =
        data.discountPrice !== undefined &&
        data.discountStartDate !== undefined &&
        data.discountEndDate !== undefined;
      return !hasAny || hasAll;
    },
    {
      message:
        "If any of discountPrice, discountStartDate, or discountEndDate is provided, all three must be provided.",
      path: ["discountPrice"],
    }
  )
  .refine(
    (data) => {
      if (!data.discountStartDate && !data.discountEndDate) return true;
      if (!data.discountStartDate || !data.discountEndDate) return false;
      return data.discountStartDate <= data.discountEndDate;
    },
    {
      message:
        "Discount start date must be before or equal to discount end date",
      path: ["discountStartDate"],
    }
  );
