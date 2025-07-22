import { NextFunction, Request, Response } from "express";
import { userLoginSchema, userRegisterSchema } from "./userValidation";
import { z } from "zod";
import { validateRequestBody, handleZodError } from "../../config/helper";
import { createUserService, loginUserService } from "./userService";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRequestBody(req.body);

    const parsedData = userRegisterSchema.parse(req.body);

    await createUserService(parsedData);

    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, res);
    }
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRequestBody(req.body);

    const parsedData = userLoginSchema.parse(req.body);

    const { token, user } = await loginUserService(parsedData);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        ...user,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, res);
    }
    next(error);
  }
};
