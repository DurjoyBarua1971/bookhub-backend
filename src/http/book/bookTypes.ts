import { Types } from "mongoose";

export type Genre = "Fiction" | "Non-Fiction";

export interface Book {
  _id: Types.ObjectId;
  title: string;
  genre: Genre;
  description: string;
  authorName: string;
  coverImageUrl: string;
  sellingPrice: number;
  buyingPrice: number;
  discountPrice?: number;
  discountStartDate?: Date;
  discountEndDate?: Date;
  quantity: number;
  addedBy: Types.ObjectId;
  organization?: Types.ObjectId;
}
