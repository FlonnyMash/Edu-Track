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

export const saveStudySessionSchema = z.object({
  userId: z.string().uuid(),
  durationSeconds: z.number().int().min(1).max(86400),
});

export const buyShopItemSchema = z.object({
  itemId: z.string().uuid(),
});

export const toggleEquipItemSchema = z.object({
  inventoryId: z.string().uuid(),
  equip: z.boolean(),
});

export const hardResetConfirmSchema = z.object({
  confirmText: z.literal("WIPE"),
});

export const grantSelfCoinsSchema = z.object({
  amount: z.number().int().min(1).max(1000000),
});

export const shopItemFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  type: z.enum(["food", "head", "accessory", "background"]),
  price: z.number().int().min(0).max(100000),
  imageUrl: z.string().url(),
  zIndex: z.number().int().min(0).max(100),
});

export const tamagotchiPhaseFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    phaseKind: z.enum(["starter", "mood"]),
    dayNumber: z.number().int().min(1).max(4).optional(),
    phaseName: z.string().min(1).max(50).optional(),
    rotationOrder: z.number().int().min(0).max(100).optional(),
    imageUrl: z.string().url(),
    conditionDescription: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.phaseKind === "starter") {
      if (!data.dayNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Starter phases require day 1–4",
          path: ["dayNumber"],
        });
      }
    } else if (!data.phaseName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mood phases require a name (e.g. happy)",
        path: ["phaseName"],
      });
    }
  });

export const aiMvpTaskResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const aiTaskResponseSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  estimated_minutes: z.number().int().min(5).max(120),
  difficulty_level: z.number().int().min(1).max(10),
  rationale: z.string(),
});

export type AiMvpTaskResponse = z.infer<typeof aiMvpTaskResponseSchema>;
export type AiTaskResponse = z.infer<typeof aiTaskResponseSchema>;
