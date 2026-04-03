import { prisma } from "../config/prisma.js";

export const logAuditEvent = async ({
  action,
  entity,
  entityId,
  userId = null,
  metadata = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        metadata,
      },
    });
  } catch (error) {
    console.warn(
      `Audit log skipped for ${entity}:${entityId} - ${error.message}`,
    );
  }
};
