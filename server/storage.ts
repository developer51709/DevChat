import {
  users,
  channels,
  messages,
  moderationLogs,
  directMessages,
  reports,
  type User,
  type InsertUser,
  type Channel,
  type InsertChannel,
  type Message,
  type InsertMessage,
  type ModerationLog,
  type InsertModerationLog,
  type DirectMessage,
  type InsertDirectMessage,
  type ChannelWithCreator,
  type MessageWithUser,
  type ModerationLogWithUser,
  type DirectMessageWithUsers,
  type Report,
  type InsertReport,
  type ReportWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, and } from "drizzle-orm";
import { randomBytes } from "crypto";

const authTokens = new Map<string, { userId: string; expiresAt: Date }>();

export interface IStorage {
  // Auth token methods
  createAuthToken(userId: string): string;
  getUserByToken(token: string): Promise<User | undefined>;
  deleteAuthToken(token: string): void;

  // Setup methods
  hasAdminUser(): Promise<boolean>;
  createAdminUser(user: InsertUser): Promise<User>;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Channel methods
  getChannels(): Promise<ChannelWithCreator[]>;
  getChannel(id: string): Promise<ChannelWithCreator | undefined>;
  createChannel(channel: InsertChannel, userId: string): Promise<Channel>;
  updateChannel(id: string, data: Partial<InsertChannel>): Promise<Channel>;
  deleteChannel(id: string): Promise<void>;

  // Message methods
  getMessagesByChannel(channelId: string): Promise<MessageWithUser[]>;
  createMessage(message: InsertMessage, userId: string): Promise<Message>;
  updateMessage(id: string, content: string): Promise<Message>;
  deleteMessage(id: string): Promise<void>;
  getMessage(id: string): Promise<Message | undefined>;
  updateMessageReactions(id: string, reactions: string): Promise<Message>;

  // Profile methods
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Direct Message methods
  getDirectMessages(userId1: string, userId2: string): Promise<DirectMessageWithUsers[]>;
  createDirectMessage(dm: InsertDirectMessage, senderId: string): Promise<DirectMessage>;
  getRecentConversations(userId: string): Promise<User[]>;

  // Report methods
  getReports(): Promise<ReportWithDetails[]>;
  createReport(report: InsertReport, reporterId: string): Promise<Report>;
  updateReportStatus(id: string, status: string): Promise<void>;

  // Moderation methods
  banUser(id: string, adminId: string, reason?: string): Promise<void>;
  timeoutUser(id: string, until: Date, adminId: string, reason?: string): Promise<void>;
  getModerationLogs(): Promise<ModerationLogWithUser[]>;
  createModerationLog(log: InsertModerationLog): Promise<ModerationLog>;
}

export class DatabaseStorage implements IStorage {
  createAuthToken(userId: string): string {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    authTokens.set(token, { userId, expiresAt });
    return token;
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    const tokenData = authTokens.get(token);
    if (!tokenData) return undefined;
    if (new Date() > tokenData.expiresAt) {
      authTokens.delete(token);
      return undefined;
    }
    return this.getUser(tokenData.userId);
  }

  deleteAuthToken(token: string): void {
    authTokens.delete(token);
  }

  async hasAdminUser(): Promise<boolean> {
    const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    return !!admin;
  }

  async createAdminUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      role: "admin",
    }).returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getChannels(): Promise<ChannelWithCreator[]> {
    const result = await db
      .select({
        id: channels.id,
        name: channels.name,
        description: channels.description,
        createdBy: channels.createdBy,
        createdAt: channels.createdAt,
        creator: {
          id: users.id,
          username: users.username,
        },
      })
      .from(channels)
      .innerJoin(users, eq(channels.createdBy, users.id))
      .orderBy(channels.createdAt);

    return result.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      creator: r.creator,
    }));
  }

  async getChannel(id: string): Promise<ChannelWithCreator | undefined> {
    const [result] = await db
      .select({
        id: channels.id,
        name: channels.name,
        description: channels.description,
        createdBy: channels.createdBy,
        createdAt: channels.createdAt,
        creator: {
          id: users.id,
          username: users.username,
        },
      })
      .from(channels)
      .innerJoin(users, eq(channels.createdBy, users.id))
      .where(eq(channels.id, id));

    if (!result) return undefined;

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      createdBy: result.createdBy,
      createdAt: result.createdAt,
      creator: result.creator,
    };
  }

  async createChannel(
    insertChannel: InsertChannel,
    userId: string
  ): Promise<Channel> {
    const [channel] = await db
      .insert(channels)
      .values({
        ...insertChannel,
        createdBy: userId,
      })
      .returning();
    return channel;
  }

  async updateChannel(id: string, data: Partial<InsertChannel>): Promise<Channel> {
    const [channel] = await db
      .update(channels)
      .set(data)
      .where(eq(channels.id, id))
      .returning();
    if (!channel) throw new Error("Channel not found");
    return channel;
  }

  async deleteChannel(id: string): Promise<void> {
    await db.delete(channels).where(eq(channels.id, id));
  }

  async getMessagesByChannel(channelId: string): Promise<MessageWithUser[]> {
    const result = await db
      .select({
        id: messages.id,
        content: messages.content,
        channelId: messages.channelId,
        userId: messages.userId,
        createdAt: messages.createdAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          role: users.role,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.channelId, channelId))
      .orderBy(messages.createdAt);

    return result.map((r) => ({
      id: r.id,
      content: r.content,
      channelId: r.channelId,
      userId: r.userId,
      attachments: null,
      reactions: "[]",
      createdAt: r.createdAt,
      user: r.user,
    }));
  }

  async createMessage(
    insertMessage: InsertMessage,
    userId: string
  ): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        userId,
      })
      .returning();
    return message;
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async updateMessage(id: string, content: string): Promise<Message> {
    const [updated] = await db
      .update(messages)
      .set({ content })
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  async updateMessageReactions(id: string, reactions: string): Promise<Message> {
    const [updated] = await db
      .update(messages)
      .set({ reactions })
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getModerationLogs(): Promise<ModerationLogWithUser[]> {
    const result = await db
      .select({
        id: moderationLogs.id,
        action: moderationLogs.action,
        targetId: moderationLogs.targetId,
        reason: moderationLogs.reason,
        adminId: moderationLogs.adminId,
        createdAt: moderationLogs.createdAt,
        admin: {
          username: users.username,
          displayName: users.displayName,
        },
      })
      .from(moderationLogs)
      .innerJoin(users, eq(moderationLogs.adminId, users.id))
      .orderBy(desc(moderationLogs.createdAt));

    return result;
  }

  async createModerationLog(log: InsertModerationLog): Promise<ModerationLog> {
    const [newLog] = await db.insert(moderationLogs).values(log).returning();
    return newLog;
  }

  async getDirectMessages(userId1: string, userId2: string): Promise<DirectMessageWithUsers[]> {
    const result = await db
      .select({
        id: directMessages.id,
        content: directMessages.content,
        senderId: directMessages.senderId,
        receiverId: directMessages.receiverId,
        createdAt: directMessages.createdAt,
        sender: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          role: users.role,
        },
      })
      .from(directMessages)
      .innerJoin(users, eq(directMessages.senderId, users.id))
      .where(
        or(
          and(eq(directMessages.senderId, userId1), eq(directMessages.receiverId, userId2)),
          and(eq(directMessages.senderId, userId2), eq(directMessages.receiverId, userId1))
        )
      )
      .orderBy(directMessages.createdAt);

    const dmsWithUsers = await Promise.all(result.map(async (r) => {
      const receiver = await this.getUser(r.receiverId);
      return {
        ...r,
        sender: r.sender,
        receiver: receiver ? { id: receiver.id, username: receiver.username, displayName: receiver.displayName, role: receiver.role } : { id: r.receiverId, username: "Unknown", displayName: "Unknown", role: "user" as const }
      } as DirectMessageWithUsers;
    }));

    return dmsWithUsers;
  }

  async createDirectMessage(insertDm: InsertDirectMessage, senderId: string): Promise<DirectMessage> {
    const [dm] = await db
      .insert(directMessages)
      .values({
        ...insertDm,
        senderId,
      })
      .returning();
    return dm;
  }

  async getRecentConversations(userId: string): Promise<User[]> {
    const sentTo = await db
      .select({ id: directMessages.receiverId })
      .from(directMessages)
      .where(eq(directMessages.senderId, userId));
    
    const receivedFrom = await db
      .select({ id: directMessages.senderId })
      .from(directMessages)
      .where(eq(directMessages.receiverId, userId));

    const uniqueUserIds = Array.from(new Set([...sentTo.map(u => u.id), ...receivedFrom.map(u => u.id)]));
    
    if (uniqueUserIds.length === 0) return [];

    return await db
      .select()
      .from(users)
      .where(or(...uniqueUserIds.map(id => eq(users.id, id))));
  }

  async getReports(): Promise<ReportWithDetails[]> {
    const result = await db
      .select({
        id: reports.id,
        reporterId: reports.reporterId,
        targetUserId: reports.targetUserId,
        targetMessageId: reports.targetMessageId,
        reason: reports.reason,
        status: reports.status,
        createdAt: reports.createdAt,
        reporter: {
          username: users.username,
          displayName: users.displayName,
        },
      })
      .from(reports)
      .innerJoin(users, eq(reports.reporterId, users.id))
      .orderBy(desc(reports.createdAt));

    const reportsWithDetails = await Promise.all(
      result.map(async (r) => {
        let targetUser;
        if (r.targetUserId) {
          const u = await this.getUser(r.targetUserId);
          if (u) {
            targetUser = { username: u.username, displayName: u.displayName };
          }
        }

        let targetMessage;
        if (r.targetMessageId) {
          const m = await this.getMessage(r.targetMessageId);
          if (m) {
            const u = await this.getUser(m.userId);
            targetMessage = {
              ...m,
              user: u ? { username: u.username, displayName: u.displayName } : { username: "Unknown", displayName: "Unknown" },
            };
          }
        }

        return {
          ...r,
          reporter: r.reporter,
          targetUser,
          targetMessage,
        } as ReportWithDetails;
      })
    );

    return reportsWithDetails;
  }

  async createReport(report: InsertReport, reporterId: string): Promise<Report> {
    const [newReport] = await db
      .insert(reports)
      .values({
        ...report,
        reporterId,
      })
      .returning();
    return newReport;
  }

  async updateReportStatus(id: string, status: string): Promise<void> {
    await db.update(reports).set({ status }).where(eq(reports.id, id));
  }

  async banUser(id: string, adminId: string, reason?: string): Promise<void> {
    await db.update(users).set({ isBanned: true }).where(eq(users.id, id));
    await this.createModerationLog({
      action: "ban_user",
      targetId: id,
      reason: reason || "No reason provided",
      adminId,
    });
  }

  async timeoutUser(id: string, until: Date, adminId: string, reason?: string): Promise<void> {
    await db.update(users).set({ timeoutUntil: until }).where(eq(users.id, id));
    await this.createModerationLog({
      action: "timeout_user",
      targetId: id,
      reason: reason || `Timeout until ${until.toISOString()}`,
      adminId,
    });
  }
}

export const storage = new DatabaseStorage();
