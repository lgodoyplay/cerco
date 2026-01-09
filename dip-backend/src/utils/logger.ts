import { prisma } from './prisma';

export const createLog = async (userId: string | null, action: string, details?: string, ip?: string) => {
  try {
    await prisma.log.create({
      data: {
        userId,
        action,
        details,
        ip
      }
    });
  } catch (error) {
    console.error('Failed to create log:', error);
  }
};
