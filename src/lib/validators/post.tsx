import { z } from "zod";

export const PostValidator = z.object({
  title: z
    .string()
    .min(3, "Title must have min 3 characters")
    .max(128, "Title must have max 128 characters"),
  subredditId: z.string(),
  content: z.any(),
});
export type PostCreationRequest = z.infer<typeof PostValidator>