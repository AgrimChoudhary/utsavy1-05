import { z } from 'zod';

export const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  template_id: z.string().optional(),
  page_name: z.string().optional(),
  details: z.record(z.any()).default({}),
});

export const guestSchema = z.object({
  name: z.string().min(1, 'Guest name is required'),
  mobile_number: z.string().min(1, 'Mobile number is required'),
  event_id: z.string().optional(),
});

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  mobile_number: z.string().min(1, 'Mobile number is required')
    .refine(val => /^\d+$/.test(val.replace(/[\s\-\(\)]/g, '')), {
      message: 'Please enter a valid mobile number (digits only)'
    }),
});

export const signInSchema = z.object({
  identifier: z.string().min(1, 'Email or mobile number is required'),
  password: z.string().min(1, 'Password is required'),
});