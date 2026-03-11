import { prisma } from "./prisma";

export async function logActivity(userId: string, action: string, details?: string) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                details,
            },
        });
    } catch (error) {
        console.error("FAILED_TO_LOG_ACTIVITY:", error);
    }
}
