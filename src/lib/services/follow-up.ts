import { prisma } from "@/lib/db";

export async function createFollowUp(params: {
  userId: string;
  applicationId?: string;
  title: string;
  description?: string;
  dueDate: Date;
}) {
  return prisma.followUpTask.create({
    data: {
      userId: params.userId,
      applicationId: params.applicationId ?? null,
      title: params.title,
      description: params.description ?? null,
      dueDate: params.dueDate,
    },
  });
}

export async function getFollowUps(userId: string) {
  return prisma.followUpTask.findMany({
    where: { userId },
    include: {
      application: { include: { job: true } },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function getDueFollowUps(userId: string) {
  return prisma.followUpTask.findMany({
    where: {
      userId,
      status: "pending",
      dueDate: { lte: new Date() },
    },
    include: {
      application: { include: { job: true } },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function markFollowUpDone(id: string) {
  return prisma.followUpTask.update({
    where: { id },
    data: { status: "done" },
  });
}
