import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, chatMessages, chatSessions, users, webhookEvents } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Chat Sessions ────────────────────────────────────────────────────────────

export async function createChatSession(userId: number, title?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatSessions).values({ userId, title: title ?? "New Conversation" });
  return result[0];
}

export async function getChatSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt)).limit(50);
}

export async function getChatSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
  if (!result[0] || result[0].userId !== userId) return undefined;
  return result[0];
}

export async function updateChatSessionTitle(sessionId: number, title: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatSessions).set({ title }).where(eq(chatSessions.id, sessionId));
}

export async function deleteChatSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const session = await getChatSession(sessionId, userId);
  if (!session) return;
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export async function addChatMessage(
  sessionId: number,
  role: "user" | "assistant" | "tool",
  content: string,
  toolName?: string,
  toolResult?: unknown
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values({ sessionId, role, content, toolName: toolName ?? null, toolResult: toolResult ?? null });
}

export async function getChatMessages(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
}

// ─── Webhook Events ───────────────────────────────────────────────────────────

export async function saveWebhookEvent(event: {
  stripeEventId: string;
  eventType: string;
  objectId?: string;
  objectType?: string;
  payload?: unknown;
}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(webhookEvents).values({
      stripeEventId: event.stripeEventId,
      eventType: event.eventType,
      objectId: event.objectId ?? null,
      objectType: event.objectType ?? null,
      status: "received",
      payload: event.payload ?? null,
    });
  } catch (e: unknown) {
    if ((e as { code?: string }).code !== "ER_DUP_ENTRY") throw e;
  }
}

export async function getWebhookEvents(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(limit);
}

export async function markWebhookProcessed(stripeEventId: string, status: "processed" | "failed") {
  const db = await getDb();
  if (!db) return;
  await db.update(webhookEvents).set({ status }).where(eq(webhookEvents.stripeEventId, stripeEventId));
}
