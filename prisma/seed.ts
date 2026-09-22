import prisma from "../src/lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  const saltRounds = 12;

  // ── Admin ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@123", saltRounds);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // ── Company ────────────────────────────────────────────
  const companyPassword = await bcrypt.hash("Company@123", saltRounds);
  const companyUser = await prisma.user.upsert({
    where: { email: "company@example.com" },
    update: {},
    create: {
      email: "company@example.com",
      password: companyPassword,
      role: "COMPANY",
      companyProfile: {
        create: {
          companyName: "Acme Tech",
          website: "https://acme.example.com",
          creditsBalance: 10,
        },
      },
    },
    include: { companyProfile: true },
  });

  const companyProfile = companyUser.companyProfile!;

  // ── Candidate ──────────────────────────────────────────
  const candidatePassword = await bcrypt.hash("Candidate@123", saltRounds);
  const candidateUser = await prisma.user.upsert({
    where: { email: "candidate@example.com" },
    update: {},
    create: {
      email: "candidate@example.com",
      password: candidatePassword,
      role: "CANDIDATE",
      candidateProfile: {
        create: {
          fullName: "Jane Candidate",
          phone: "+61000000000",
        },
      },
    },
    include: { candidateProfile: true },
  });

  // ── Problems ───────────────────────────────────────────
  const problem1 = await prisma.problem.create({
    data: {
      companyId: companyProfile.id,
      title: "Two Sum",
      description:
        "Given an array of integers, return indices of the two numbers that add up to a target.",
      type: "CODING",
      difficulty: "EASY",
      tags: ["arrays", "hashmap"],
      expectedOutput: "[0,1]",
    },
  });

  const problem2 = await prisma.problem.create({
    data: {
      companyId: companyProfile.id,
      title: "What is a closure in JavaScript?",
      description: "Select the best definition of a closure.",
      type: "MCQ",
      difficulty: "MEDIUM",
      tags: ["javascript", "fundamentals"],
      expectedOutput: "A function that retains access to its outer scope",
    },
  });

  // ── Assessment ─────────────────────────────────────────
  const assessment = await prisma.assessment.create({
    data: {
      companyId: companyProfile.id,
      title: "Frontend Developer Screening",
      description: "Initial screening assessment for frontend candidates.",
      durationMins: 60,
      passingScore: 70,
      status: "PUBLISHED",
      problems: {
        create: [
          { problemId: problem1.id, order: 1, points: 50 },
          { problemId: problem2.id, order: 2, points: 50 },
        ],
      },
    },
  });

  console.log("Seed complete:");
  console.log({
    admin: admin.email,
    company: companyUser.email,
    candidate: candidateUser.email,
    assessment: assessment.title,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
