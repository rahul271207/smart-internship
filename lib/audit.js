import { getDb } from "./db.js";

export async function writeAudit(
  actorId,
  actorRole,
  action,
  targetType,
  targetId = null,
  { beforeState = null, afterState = null, requestMetadata = null } = {}
) {
  try {
    const db = await getDb();
    const entry = {
      _id: "aud_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      actor_id: actorId ? String(actorId) : "system",
      actor_role: actorRole || "system",
      action,
      target_type: targetType,
      target_id: targetId ? String(targetId) : null,
      before_state: beforeState,
      after_state: afterState,
      request_metadata: requestMetadata,
      timestamp: new Date().toISOString(),
    };
    await db.audit_logs.insertOne(entry);
    return entry;
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
