import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Helper function to generate UUID
const generateId = () => crypto.randomUUID();

// User roles
export const userRoles = ["user", "moderator", "admin"] as const;
export type UserRole = typeof userRoles[number];

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(generateId),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  password: text("password").notNull(),
  role: text("role").$type<UserRole>().default("user").notNull(),
  bio: text("bio"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Channels table
export const channels = sqliteTable("channels", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Messages table
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(generateId),
  content: text("content").notNull(),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Direct Messages table
export const directMessages = sqliteTable("direct_messages", {
  id: text("id").primaryKey().$defaultFn(generateId),
  content: text("content").notNull(),
  senderId: text("sender_id").notNull().references(() => users.id),
  receiverId: text("receiver_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  channels: many(channels),
  messages: many(messages),
  sentDirectMessages: many(directMessages, { relationName: "sender" }),
  receivedDirectMessages: many(directMessages, { relationName: "receiver" }),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [directMessages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({
  id: true,
  senderId: true,
  createdAt: true,
});

export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;

export type DirectMessageWithUsers = DirectMessage & {
  sender: Pick<User, "id" | "username" | "displayName">;
  receiver: Pick<User, "id" | "username" | "displayName">;
};

export const channelsRelations = relations(channels, ({ one, many }) => ({
  creator: one(users, {
    fields: [channels.createdBy],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdBy: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).optional(),
  displayName: z.string().min(1).optional(),
  bio: z.string().max(500).optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type MessageWithUser = Message & {
  user: Pick<User, "id" | "username" | "displayName">;
};

// Extended types for API responses
export type ChannelWithCreator = Channel & {
  creator: Pick<User, "id" | "username">;
  messageCount?: number;
};

export const moderationLogs = sqliteTable("moderation_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  action: text("action").notNull(), // 'delete_message', 'timeout_user', 'ban_user'
  targetId: text("target_id").notNull(),
  reason: text("reason"),
  adminId: text("admin_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertModerationLogSchema = createInsertSchema(moderationLogs);
export type ModerationLog = typeof moderationLogs.$inferSelect;
export type InsertModerationLog = z.infer<typeof insertModerationLogSchema>;

export type ModerationLogWithUser = ModerationLog & {
  admin: Pick<User, "username" | "displayName">;
};

