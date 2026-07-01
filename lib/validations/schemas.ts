import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const goalSetupSchema = z.object({
  title: z.string().min(2, "Goal title is required").max(100),
  description: z.string().max(500).optional(),
  difficultyPreference: z.enum(["gentle", "balanced", "ambitious"]),
  timezone: z.string().min(1),
});

export const completeTaskSchema = z.object({
  taskId: z.string().uuid(),
  reflectionNotes: z.string().max(1000).optional(),
});

export const aiTaskResponseSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  estimated_minutes: z.number().int().min(5).max(120),
  difficulty_level: z.number().int().min(1).max(10),
  rationale: z.string(),
});

export type AiTaskResponse = z.infer<typeof aiTaskResponseSchema>;
