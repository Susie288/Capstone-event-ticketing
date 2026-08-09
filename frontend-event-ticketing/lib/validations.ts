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
    .min(1, "Phone number is required")
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
