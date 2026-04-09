import { z } from "zod";

export const TITLE_MAX = 32;
export const DESCRIPTION_MAX = 124;
export const LABEL_TEXT_MAX = 24;
export const LABELS_MAX = 5;

const labelSchema = z.object({
  id: z.string().min(1, "Each label must have an identifier."),
  text: z
    .string()
    .min(1, "Label text cannot be blank.")
    .max(LABEL_TEXT_MAX, `Label text must be at most ${LABEL_TEXT_MAX} characters.`),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Label color must be a valid hex (e.g. #3b82f6)."),
});

/** Schema for scene create/edit form data (no id/userId/createdAt). */
export const sceneFormSchema = z.object({
  title: z
    .string()
    .min(1, "Scene title is required.")
    .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters.`),
  description: z
    .string()
    .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters.`),
  labels: z
    .array(labelSchema)
    .max(LABELS_MAX, `At most ${LABELS_MAX} labels are allowed.`),
});

export type SceneFormData = z.infer<typeof sceneFormSchema>;

/** Validates form data and returns errors per field (key = field name). */
export function validateSceneForm(data: {
  title: string;
  description: string;
  labels: Array<{ id: string; text: string; color: string }>;
}): { success: true; data: SceneFormData } | { success: false; errors: Record<string, string> } {
  const normalized = {
    title: (data.title ?? "").trim().slice(0, TITLE_MAX),
    description: (data.description ?? "").trim().slice(0, DESCRIPTION_MAX),
    labels: (data.labels ?? []).slice(0, LABELS_MAX).map((l) => ({
      id: l.id,
      text: l.text.trim().slice(0, LABEL_TEXT_MAX),
      color: l.color,
    })),
  };

  const result = sceneFormSchema.safeParse(normalized);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return { success: false, errors };
}

