// Referenced from javascript_auth_all_persistance and javascript_websocket blueprints
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import {
  insertChannelSchema,
  insertMessageSchema,
  updateProfileSchema,
  updatePasswordSchema,
  type MessageWithUser,
} from "@shared/schema";

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Channel routes
  app.get("/api/channels", requireAuth, async (req, res) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).send("Failed to fetch channels");
    }
  });

  app.get("/api/channels/:id", requireAuth, async (req, res) => {
    try {
      const channel = await storage.getChannel(req.params.id);
      if (!channel) {
        return res.status(404).send("Channel not found");
      }
      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).send("Failed to fetch channel");
    }
  });

  app.post("/api/channels", requireAuth, async (req, res) => {
    try {
      const validatedData = insertChannelSchema.parse(req.body);
      const channel = await storage.createChannel(validatedData, req.user!.id);
      const channelWithCreator = await storage.getChannel(channel.id);
      res.status(201).json(channelWithCreator);
    } catch (error: any) {
      console.error("Error creating channel:", error);
      res.status(400).send(error.message || "Failed to create channel");
    }
  });

  // Message routes
  app.get("/api/channels/:channelId/messages", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getMessagesByChannel(req.params.channelId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Failed to fetch messages");
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData, req.user!.id);

      // Broadcast new message to all connected clients via WebSocket
      const messageWithUser = await storage.getMessagesByChannel(message.channelId);
      const newMessage = messageWithUser[messageWithUser.length - 1];

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "NEW_MESSAGE",
              channelId: message.channelId,
              message: newMessage,
            })
          );
        }
      });

      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).send(error.message || "Failed to create message");
    }
  });

  app.patch("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) return res.status(400).send("Content is required");
      
      const message = await storage.getMessage(req.params.id);
      if (!message) return res.status(404).send("Message not found");
      if (message.userId !== req.user!.id) return res.status(403).send("Unauthorized");

      const updated = await storage.updateMessage(req.params.id, content);
      
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "UPDATE_MESSAGE",
            channelId: updated.channelId,
            message: { 
              ...updated, 
              user: { 
                id: req.user!.id, 
                username: req.user!.username,
                displayName: req.user!.displayName
              } 
            }
          }));
        }
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      const message = await storage.getMessage(req.params.id);
      if (!message) return res.status(404).send("Message not found");
      if (message.userId !== req.user!.id) return res.status(403).send("Unauthorized");

      await storage.deleteMessage(req.params.id);
      
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "DELETE_MESSAGE",
            channelId: message.channelId,
            messageId: req.params.id
          }));
        }
      });

      res.sendStatus(200);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Account settings routes
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const user = await storage.updateUser(req.user!.id, data);
      res.json(user);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).send("User not found");
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/user/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
      const user = await storage.getUser(req.user!.id);
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).send("Invalid current password");
      }
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      res.sendStatus(200);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.delete("/api/user", requireAuth, async (req, res) => {
    try {
      await storage.deleteUser(req.user!.id);
      req.logout((err) => {
        if (err) return res.status(500).send("Logout failed");
        res.sendStatus(200);
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup on distinct path to avoid conflicts with Vite HMR
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("message", (data) => {
      console.log("Received message from client:", data.toString());
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return httpServer;
}
