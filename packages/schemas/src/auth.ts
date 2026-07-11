import { z } from 'zod';

/** Password policy: min 8 chars, at least one uppercase letter and one digit. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

/** Server-side registration input (POST /api/auth/register). */
export const RegisterSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2, 'Name is too short').max(100, 'Name is too long'),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

/** Client-side registration form (adds confirm + terms). */
export const RegisterFormSchema = RegisterSchema.extend({
  confirmPassword: z.string(),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to continue' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
export type RegisterFormInput = z.infer<typeof RegisterFormSchema>;

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ResetPasswordRequestSchema = z.object({
  email: emailSchema,
});
export type ResetPasswordRequestInput = z.infer<typeof ResetPasswordRequestSchema>;

/** New password when confirming a reset (client form has confirmPassword too). */
export const ResetPasswordSchema = z.object({
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ResetPasswordConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});
export type ResetPasswordConfirmInput = z.infer<typeof ResetPasswordConfirmSchema>;

export const ResetPasswordFormSchema = ResetPasswordSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
export type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;
