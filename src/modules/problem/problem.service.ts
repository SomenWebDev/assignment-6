import httpStatus from "http-status";

import prisma from "../../lib/prisma";
import AppError from "../../errors/AppError";

type ProblemType = "CODING" | "MCQ" | "WRITTEN";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

type CreateProblemInput = {
  title: string;
  description: string;
  type: ProblemType;
  difficulty: Difficulty;
  tags?: string[];
  expectedOutput?: string;
};

type UpdateProblemInput = Partial<CreateProblemInput>;

export type ListProblemsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  type?: ProblemType;
  difficulty?: Difficulty;
  tag?: string;
  sortBy?: "createdAt" | "title" | "difficulty";
  order?: "asc" | "desc";
};

async function getCompanyId(userId: string) {
  const company = await prisma.companyProfile.findUnique({
    where: { userId },
  });

  if (!company || company.deletedAt) {
    throw new AppError(httpStatus.FORBIDDEN, "Company profile not found");
  }

  return company.id;
}

export async function createProblem(userId: string, input: CreateProblemInput) {
  const companyId = await getCompanyId(userId);

  return prisma.problem.create({
    data: {
      companyId,
      title: input.title,
      description: input.description,
      type: input.type,
      difficulty: input.difficulty,
      tags: input.tags ?? [],
      ...(input.expectedOutput !== undefined && {
        expectedOutput: input.expectedOutput,
      }),
    },
  });
}

export async function getProblems(userId: string, query: ListProblemsQuery) {
  const companyId = await getCompanyId(userId);

  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 10;
  const order = query.order ?? "desc";

  const where = {
    companyId,
    deletedAt: null,
    ...(query.type ? { type: query.type } : {}),
    ...(query.difficulty ? { difficulty: query.difficulty } : {}),
    ...(query.tag ? { tags: { has: query.tag } } : {}),
    ...(query.search
      ? { title: { contains: query.search, mode: "insensitive" as const } }
      : {}),
  };

  const orderBy =
    query.sortBy === "title"
      ? { title: order }
      : query.sortBy === "difficulty"
        ? { difficulty: order }
        : { createdAt: order };

  const [problems, total] = await prisma.$transaction([
    prisma.problem.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.problem.count({ where }),
  ]);

  return { problems, meta: { page, limit, total } };
}

export async function getProblemById(userId: string, id: string) {
  const companyId = await getCompanyId(userId);

  const problem = await prisma.problem.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!problem) {
    throw new AppError(httpStatus.NOT_FOUND, "Problem not found");
  }

  return problem;
}

export async function updateProblem(
  userId: string,
  id: string,
  input: UpdateProblemInput,
) {
  await getProblemById(userId, id);

  return prisma.problem.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.expectedOutput !== undefined && {
        expectedOutput: input.expectedOutput,
      }),
    },
  });
}

export async function deleteProblem(userId: string, id: string) {
  await getProblemById(userId, id);

  await prisma.problem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
