import {
  users,
  channels,
  messages,
  type User,
  type InsertUser,
  type Channel,
  type InsertChannel,
  type Message,
  type InsertMessage,
  type ChannelWithCreator,
  type MessageWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Channel methods
  getChannels(): Promise<ChannelWithCreator[]>;
  getChannel(id: string): Promise<ChannelWithCreator | undefined>;
  createChannel(channel: InsertChannel, userId: string): Promise<Channel>;

  // Message methods
  getMessagesByChannel(channelId: string): Promise<MessageWithUser[]>;
  createMessage(message: InsertMessage, userId: string): Promise<Message>;
  updateMessage(id: string, content: string): Promise<Message>;
  deleteMessage(id: string): Promise<void>;
  getMessage(id: string): Promise<Message | undefined>;

  // Profile methods
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
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
    const [message] = await db
      .update(messages)
      .set({ content })
      .where(eq(messages.id, id))
      .returning();
    return message;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const storage = new DatabaseStorage();
