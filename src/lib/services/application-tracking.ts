import { prisma } from "@/lib/db";

export async function markApplied(userId: string, jobId: string, notes?: string) {
  return prisma.application.upsert({
    where: { id: `${userId}-${jobId}` },
    create: {
      id: `${userId}-${jobId}`,
      userId,
      jobId,
      status: "applied",
      appliedAt: new Date(),
      notes: notes ?? null,
    },
    update: {
      status: "applied",
      appliedAt: new Date(),
      notes: notes ?? undefined,
    },
  });
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  return prisma.application.update({
    where: { id: applicationId },
    data: { status },
  });
}

export async function logOutreach(params: {
  userId: string;
  applicationId?: string;
  personId?: string;
  type: string;
  channel: string;
  notes?: string;
}) {
  return prisma.outreachEvent.create({
    data: {
      userId: params.userId,
      applicationId: params.applicationId ?? null,
      personId: params.personId ?? null,
      type: params.type,
      channel: params.channel,
      notes: params.notes ?? null,
    },
  });
}

export async function getApplications(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    include: {
      job: true,
      outreachEvents: { include: { person: true } },
      followUpTasks: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
