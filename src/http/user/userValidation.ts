import { z } from "zod";

export const userRegisterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(10, "Name must not exceed 10 characters"),
  email: z.email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userLoginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});