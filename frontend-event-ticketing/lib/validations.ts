import { z } from "zod";

export const registrationSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  fullName: z
    .string()
    .min(2, "Enter your full name")
    .max(80, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[+]?[\d\s-()]{7,20}$/.test(val), {
      message: "Enter a valid phone number",
    }),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
