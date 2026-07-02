import { z } from "zod";

/**
 * Reusable content templates. Category constrains the body shape via a
 * discriminated union; runtime validation goes through the zod schemas below.
 */

export const TEMPLATE_CATEGORIES = [
  "social_facebook",
  "social_instagram",
  "admin_letter",
  "landing_takeover",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  social_facebook: "Facebook post",
  social_instagram: "Instagram post",
  admin_letter: "Admin letter",
  landing_takeover: "Landing takeover",
};

export const CATEGORY_ICON: Record<TemplateCategory, string> = {
  social_facebook: "📘",
  social_instagram: "📸",
  admin_letter: "✉️",
  landing_takeover: "🚩",
};

// -------- Body shapes -------------------------------------------------------

export const socialBodySchema = z.object({
  kind: z.literal("social"),
  text: z.string().min(1, "Post text is required").max(2200),
  hashtags: z.array(z.string().regex(/^#?[A-Za-z0-9_]+$/)).default([]),
});

export const letterBodySchema = z.object({
  kind: z.literal("letter"),
  markdown: z.string().min(1, "Letter body is required"),
  recipientName: z.string().optional().default(""),
  signerName: z.string().optional().default(""),
  signerRole: z.string().optional().default(""),
});

export const takeoverBodySchema = z.object({
  kind: z.literal("takeover"),
  heading: z.string().min(1, "Heading is required").max(120),
  body: z.string().min(1, "Body is required").max(600),
  ctaLabel: z.string().max(40).nullable().default(null),
  ctaUrl: z.string().url().nullable().default(null),
});

export const templateBodySchema = z.discriminatedUnion("kind", [
  socialBodySchema,
  letterBodySchema,
  takeoverBodySchema,
]);

export type SocialBody = z.infer<typeof socialBodySchema>;
export type LetterBody = z.infer<typeof letterBodySchema>;
export type TakeoverBody = z.infer<typeof takeoverBodySchema>;
export type TemplateBody = z.infer<typeof templateBodySchema>;

// -------- Category → body kind mapping --------------------------------------

const CATEGORY_TO_BODY_KIND = {
  social_facebook: "social",
  social_instagram: "social",
  admin_letter: "letter",
  landing_takeover: "takeover",
} as const satisfies Record<TemplateCategory, TemplateBody["kind"]>;

export function expectedBodyKind(category: TemplateCategory): TemplateBody["kind"] {
  return CATEGORY_TO_BODY_KIND[category];
}

// -------- Template row (matches DB shape after camelCase mapping) -----------

export type Template = {
  id: string;
  title: string;
  category: TemplateCategory;
  body: TemplateBody;
  imagePath: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

// -------- Server-action schemas ---------------------------------------------

export const createTemplateSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    category: z.enum(TEMPLATE_CATEGORIES),
    body: templateBodySchema,
    imagePath: z.string().nullable().default(null),
  })
  .refine((data) => data.body.kind === expectedBodyKind(data.category), {
    message: "Body shape does not match the chosen category",
    path: ["body"],
  });

export const updateTemplateSchema = z.object({
  id: z.string().uuid(),
  patch: createTemplateSchema.innerType().partial(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
