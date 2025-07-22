import Book from "./bookModel";
import { defineError } from "../../config/helper";

export interface CreateBookData {
  title: string;
  genre: "Fiction" | "Non-Fiction";
  description: string;
  author: string;
  sellingPrice: number;
  buyingPrice: number;
  discountPrice?: number;
  discountStartDate?: Date;
  discountEndDate?: Date;
  quantity: number;
  coverImageUrl: string;
  addedBy: string;
  organization: string;
}

export interface UpdateBookData
  extends Partial<Omit<CreateBookData, "addedBy" | "organization">> {}

export interface BookFilters {
  title?: string;
  genre?: string;
  author?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  organization: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export const createBookService = async (bookData: CreateBookData) => {
  const newBook = await Book.create(bookData);
  const bookResponse = newBook.toObject();
  delete bookResponse.organization;

  return bookResponse;
};

export const updateBookService = async (
  bookId: string,
  organization: string,
  updateData: UpdateBookData
) => {
  const existingBook = await Book.findOne({ _id: bookId, organization });
  if (!existingBook) {
    throw defineError("Book not found", 404);
  }

  // Update book
  const updatedBook = await Book.findByIdAndUpdate(bookId, updateData, {
    new: true,
  });

  if (!updatedBook) {
    throw defineError("Failed to update book", 500);
  }

  // Remove organization field from response
  const bookResponse = updatedBook.toObject();
  delete bookResponse.organization;

  return { updatedBook: bookResponse, oldBook: existingBook };
};

export const deleteBookService = async (
  bookId: string,
  organization: string
) => {
  const book = await Book.findOne({ _id: bookId, organization });
  if (!book) {
    throw defineError("Book not found", 404);
  }

  await Book.deleteOne({ _id: bookId });
  return book;
};

export const getBooksService = async (
  filters: BookFilters,
  pagination: PaginationOptions
) => {
  const { organization, title, genre, author, minPrice, maxPrice, inStock } =
    filters;
  const { page, limit } = pagination;

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
    if (minPrice) query.sellingPrice.$gte = minPrice;
    if (maxPrice) query.sellingPrice.$lte = maxPrice;
  }

  if (inStock !== undefined) {
    query.quantity = inStock ? { $gt: 0 } : 0;
  }

  const books = await Book.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .select("-organization")
    .populate("addedBy", "name");

  const total = await Book.countDocuments(query);

  return {
    books,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getBookService = async (bookId: string, organization: string) => {
  const book = await Book.findOne({ _id: bookId, organization })
    .select("-organization")
    .populate("addedBy", "name");

  if (!book) {
    throw defineError("Book not found", 404);
  }

  return book;
};
