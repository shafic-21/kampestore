import { z } from "zod";

export const emailSchema = z.string().email("Please enter a valid email address");

export const phoneSchema = z
  .string()
  .min(9, "Phone number must be at least 9 digits")
  .max(10, "Phone number must be at most 10 digits")
  .regex(/^[0-9]+$/, "Phone number must contain only digits")
  .refine((phone) => {
    const cleanPhone = phone.replace(/\s/g, "");
    return cleanPhone.length >= 9 && cleanPhone.length <= 10;
  }, "Please enter a valid Uganda phone number");

export const fullNameSchema = z
  .string()
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name must be at most 100 characters")
  .regex(/^[a-zA-Z\s]+$/, "Full name must contain only letters and spaces");

export const checkUserExistsSchema = z.object({
  email: emailSchema,
});

export const signUpSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  fullName: fullNameSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
});

export type CheckUserExistsInput = z.infer<typeof checkUserExistsSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;