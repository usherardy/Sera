import { z } from "zod";

const line = z.string().trim().min(1).max(300);

/** The original agreement, as submitted from the create / edit form. */
export const ProjectInput = z.object({
  name: z.string().trim().min(1).max(160),
  client_name: z.string().trim().min(1).max(160),
  original_description: z.string().trim().max(4000),
  agreed_scope: z.array(line).min(1, "Add at least one agreed deliverable.").max(60),
  exclusions: z.array(line).max(60),
  fixed_price: z.number().min(0).max(100_000_000).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  deadline: z.iso.date().nullable(),
});

export type ProjectInputT = z.infer<typeof ProjectInput>;
