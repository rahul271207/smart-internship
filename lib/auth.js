import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { getDb } from "./db.js";

export function hashPassword(password) {
  const truncated = (password || "").slice(0, 72);
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(truncated, salt);
}

export function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  const truncated = password.slice(0, 72);
  try {
    return bcrypt.compareSync(truncated, hash);
  } catch {
    return false;
  }
}

export function createAccessToken(subject, role, extra = {}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(subject),
    role,
    iat: now,
    exp: now + config.accessTokenExpireMinutes * 60,
    ...extra,
  };
  return jwt.sign(payload, config.secretKey, { algorithm: "HS256" });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.secretKey, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}

export function cleanUser(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password_hash;
  if (copy._id) {
    copy.id = String(copy._id);
  }
  return copy;
}

export async function getUserFromRequest(request) {
  try {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7).trim();
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.sub) return null;

    const db = await getDb();
    const user = await db.users.findOne({ _id: decoded.sub });
    if (!user || !user.is_active) return null;
    return user;
  } catch (err) {
    console.error("Auth error:", err);
    return null;
  }
}

export function requireRole(user, ...roles) {
  if (!user) {
    return { ok: false, status: 401, error: "Authentication required." };
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return { ok: false, status: 403, error: "Insufficient permissions." };
  }
  return { ok: true };
}
