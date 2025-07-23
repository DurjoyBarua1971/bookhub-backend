import Book from "./bookModel";
import { defineError } from "../../config/helper";
import {
  BookFilters,
  CreateBookData,
  PaginationOptions,
  UpdateBookData,
} from "./bookTypes";
import mongoose, { Types } from "mongoose";

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

export const getDashboardStatsService = async (organization: string) => {
  const [statsAggregation, recentBooks] = await Promise.all([
    Book.aggregate([
      { $match: { organization: new Types.ObjectId(organization) } },
      {
        $facet: {
          totalBooks: [{ $count: "count" }],
          booksInStock: [
            { $match: { quantity: { $gt: 0 } } },
            { $count: "count" },
          ],
          outOfStockBooks: [{ $match: { quantity: 0 } }, { $count: "count" }],
          booksByGenre: [{ $group: { _id: "$genre", count: { $sum: 1 } } }],
          inventoryValue: [
            {
              $group: {
                _id: null,
                total: { $sum: { $multiply: ["$buyingPrice", "$quantity"] } },
              },
            },
          ],
        },
      },
      {
        $project: {
          totalBooks: { $arrayElemAt: ["$totalBooks.count", 0] },
          booksInStock: { $arrayElemAt: ["$booksInStock.count", 0] },
          outOfStockBooks: { $arrayElemAt: ["$outOfStockBooks.count", 0] },
          booksByGenre: {
            $arrayToObject: {
              $map: {
                input: "$booksByGenre",
                as: "genre",
                in: { k: "$$genre._id", v: "$$genre.count" },
              },
            },
          },
          totalInventoryValue: { $arrayElemAt: ["$inventoryValue.total", 0] },
        },
      },
    ]),
    // Fetch recent books in parallel
    Book.find({ organization })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title author createdAt coverImageUrl")
      .populate("addedBy", "name")
      .lean(), // Use lean() for faster query execution
  ]);

  const stats = statsAggregation[0] || {
    totalBooks: 0,
    booksInStock: 0,
    outOfStockBooks: 0,
    booksByGenre: {},
    totalInventoryValue: 0,
  };

  return {
    totalBooks: stats.totalBooks || 0,
    booksInStock: stats.booksInStock || 0,
    outOfStockBooks: stats.outOfStockBooks || 0,
    booksByGenre: stats.booksByGenre || {},
    totalInventoryValue: stats.totalInventoryValue || 0,
    recentBooks,
  };
};
