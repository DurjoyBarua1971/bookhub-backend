import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";

const errorMiddleware = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.error(err.message); // Log the error for debugging
    res.status(err.statusCode || 500).json({
      succuss: false,
      message: err.message || "Internal Server Error",
    });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
