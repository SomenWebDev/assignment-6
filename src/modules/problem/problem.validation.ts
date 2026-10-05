import { z } from "zod";

const problemTypes = ["CODING", "MCQ", "WRITTEN"] as const;
const difficulties = ["EASY", "MEDIUM", "HARD"] as const;

const createProblemSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    type: z.enum(problemTypes),
    difficulty: z.enum(difficulties),
    tags: z.array(z.string().min(1)).optional(),
    expectedOutput: z.string().optional(),
  }),
});

const updateProblemSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid problem id"),
  }),
  body: z
    .object({
      title: z.string().min(3).optional(),
      description: z.string().min(10).optional(),
      type: z.enum(problemTypes).optional(),
      difficulty: z.enum(difficulties).optional(),
      tags: z.array(z.string().min(1)).optional(),
      expectedOutput: z.string().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "Provide at least one field to update",
    }),
});

const problemIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid problem id"),
  }),
});

const listProblemsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, "page must be a number").optional(),
    limit: z.string().regex(/^\d+$/, "limit must be a number").optional(),
    search: z.string().optional(),
    type: z.enum(problemTypes).optional(),
    difficulty: z.enum(difficulties).optional(),
    tag: z.string().optional(),
    sortBy: z.enum(["createdAt", "title", "difficulty"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
  }),
});

export const ProblemValidation = {
  createProblemSchema,
  updateProblemSchema,
  problemIdSchema,
  listProblemsSchema,
};
