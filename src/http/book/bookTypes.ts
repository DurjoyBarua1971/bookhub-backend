import { Types } from "mongoose";

export type Genre = "Fiction" | "Non-Fiction";
export interface Book {
  _id: Types.ObjectId;
  title: string;
  genre: Genre;
  description: string;
  author: string;
  coverImageUrl: string;
  sellingPrice: number;
  buyingPrice: number;
  discountPrice?: number;
  discountStartDate?: Date;
  discountEndDate?: Date;
  quantity: number;
  addedBy: Types.ObjectId;
  organization?: string;
}

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