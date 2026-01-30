import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, integer, boolean, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  password: text("password").notNull(),
  role: text("role").$type<"user" | "moderator" | "admin">().default("user").notNull(),
  bio: text("bio"),
  isBanned: boolean("is_banned").default(false).notNull(),
  timeoutUntil: timestamp("timeout_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Channels table
export const channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  channelId: varchar("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Direct Messages table
export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reports table
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  targetUserId: varchar("target_user_id").references(() => users.id),
  targetMessageId: varchar("target_message_id").references(() => messages.id),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'resolved', 'dismissed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moderationLogs = pgTable("moderation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(), // 'delete_message', 'timeout_user', 'ban_user'
  targetId: text("target_id").notNull(),
  reason: text("reason"),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({
  id: true,
  senderId: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  reporterId: true,
  createdAt: true,
  status: true,
});

export const insertModerationLogSchema = createInsertSchema(moderationLogs);

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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type ModerationLog = typeof moderationLogs.$inferSelect;
export type InsertModerationLog = z.infer<typeof insertModerationLogSchema>;

export type MessageWithUser = Message & {
  user: Pick<User, "id" | "username" | "displayName" | "role">;
};

export type ChannelWithCreator = Channel & {
  creator: Pick<User, "id" | "username">;
  messageCount?: number;
};

export type DirectMessageWithUsers = DirectMessage & {
  sender: Pick<User, "id" | "username" | "displayName" | "role">;
  receiver: Pick<User, "id" | "username" | "displayName" | "role">;
};

export type ReportWithDetails = Report & {
  reporter: Pick<User, "username" | "displayName">;
  targetUser?: Pick<User, "username" | "displayName">;
  targetMessage?: Message & { user: Pick<User, "username" | "displayName"> };
};

export type ModerationLogWithUser = ModerationLog & {
  admin: Pick<User, "username" | "displayName">;
};
