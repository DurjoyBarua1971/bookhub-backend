import mongoose from "mongoose";
import { Book } from "./bookTypes";

const bookSchema = new mongoose.Schema<Book>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [100, "Title must not exceed 100 characters"],
    },
    genre: {
      type: String,
      enum: ["Fiction", "Non-Fiction"],
      required: [true, "Genre is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: 10,
      maxlength: 500,
    },
    authorName: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      minlength: [3, "Author name must be at least 3 characters long"],
      maxlength: [50, "Author name must not exceed 50 characters"],
    },
    coverImageUrl: {
      type: String,
      required: [true, "Cover image URL is required"],
      trim: true,
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price must be a positive number"],
    },
    buyingPrice: {
      type: Number,
      required: [true, "Buying price is required"],
      min: [0, "Buying price must be a positive number"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price must be a positive number if provided"],
    },
    discountStartDate: { type: Date },
    discountEndDate: { type: Date },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity must be a non-negative number"],
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Added by user is required"],
      index: true,
    }
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model<Book>("Book", bookSchema);

export default Book;