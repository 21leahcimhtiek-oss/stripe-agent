import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Chat sessions for conversation history
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull().default("New Conversation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;

// Individual chat messages
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "tool"]).notNull(),
  content: text("content").notNull(),
  toolName: varchar("toolName", { length: 128 }),
  toolResult: json("toolResult"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

// Stripe webhook events log
export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  stripeEventId: varchar("stripeEventId", { length: 128 }).notNull().unique(),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  objectId: varchar("objectId", { length: 128 }),
  objectType: varchar("objectType", { length: 64 }),
  status: mysqlEnum("status", ["received", "processed", "failed"]).default("received").notNull(),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;