import express from "express";
import { createBook, deleteBook, updateBook, getBooks, getBook } from "./bookController";
import multer from "multer";
import path from "node:path";
import authorize from "../../middleware/auth.middleware";

const upload = multer({
  dest: path.resolve(__dirname, "../../../public/uploads"),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const bookRouter = express.Router();

bookRouter.use(authorize);

bookRouter.post(
  "/add",
  upload.fields([{ name: "image", maxCount: 1 }]),
  createBook
);

bookRouter.delete("/:id", deleteBook);
bookRouter.patch(
  "/:id",
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateBook
);

bookRouter.get('/', getBooks)
bookRouter.get("/:id", getBook);

export default bookRouter;
