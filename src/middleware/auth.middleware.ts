import { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "../config/env";
import jwt from "jsonwebtoken";
import User from "../http/user/userModel";
import { defineError } from "../config/helper";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const authorize = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return defineError("No token provided", 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET as string);
    const userId = (decoded as jwt.JwtPayload).id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const _req = req as AuthRequest;

    _req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while verifying the token",
    });
  }
};

export default authorize;
