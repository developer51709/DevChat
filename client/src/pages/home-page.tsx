import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { ChannelList } from "@/components/channel-list";
import { MessageList } from "@/components/message-list";
import { MessageInput } from "@/components/message-input";
import { UserProfile } from "@/components/user-profile";
import { CreateChannelDialog } from "@/components/create-channel-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  type ChannelWithCreator,
  type MessageWithUser,
  type InsertChannel,
  type InsertMessage,
} from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  // WebSocket handler for real-time messages
  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === "NEW_MESSAGE") {
      // Invalidate messages query for the specific channel to refetch
      queryClient.invalidateQueries({
        queryKey: ["/api/channels", data.channelId, "messages"],
      });
    }
  }, []);

  // Connect to WebSocket
  useWebSocket(handleWebSocketMessage, !!user);

  // Fetch channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<
    ChannelWithCreator[]
  >({
    queryKey: ["/api/channels"],
  });

  // Fetch messages for active channel
  const { data: messages = [], isLoading: messagesLoading } = useQuery<
    MessageWithUser[]
  >({
    queryKey: ["/api/channels", activeChannelId, "messages"],
    enabled: !!activeChannelId,
  });

  // Set first channel as active when channels load
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: async (data: InsertChannel) => {
      const res = await apiRequest("POST", "/api/channels", data);
      return await res.json();
    },
    onSuccess: (newChannel: ChannelWithCreator) => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      setActiveChannelId(newChannel.id);
      setIsCreateChannelOpen(false);
      toast({
        title: "Channel created",
        description: `#${newChannel.name} has been created successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create channel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: InsertMessage) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/channels", activeChannelId, "messages"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateChannel = (name: string, description?: string) => {
    createChannelMutation.mutate({ name, description });
  };

  const handleSendMessage = (content: string) => {
    if (activeChannelId) {
      sendMessageMutation.mutate({
        content,
        channelId: activeChannelId,
      });
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // Count user's messages
  const userMessageCount = messages.filter((m) => m.userId === user?.id).length;

  return (
    <div className="h-screen flex bg-background">
      {/* Left sidebar - Channel list */}
      <div className="w-70 flex-shrink-0">
        <ChannelList
          channels={channels}
          activeChannelId={activeChannelId}
          onChannelSelect={setActiveChannelId}
          onCreateChannel={() => setIsCreateChannelOpen(true)}
          isLoading={channelsLoading}
        />
        {user && (
          <UserProfile
            user={user}
            messageCount={userMessageCount}
            onLogout={() => logoutMutation.mutate()}
          />
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Channel header */}
        <div className="h-14 border-b border-border px-4 flex items-center bg-background">
          {activeChannel ? (
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                # {activeChannel.name}
              </h1>
              {activeChannel.description && (
                <p className="text-xs text-muted-foreground">
                  {activeChannel.description}
                </p>
              )}
            </div>
          ) : (
            <h1 className="text-lg font-semibold text-muted-foreground">
              Select a channel
            </h1>
          )}
        </div>

        {/* Messages area */}
        {activeChannelId ? (
          <>
            <MessageList
              messages={messages}
              isLoading={messagesLoading}
              currentUserId={user?.id || ""}
            />
            <MessageInput
              channelName={activeChannel?.name || ""}
              onSendMessage={handleSendMessage}
              disabled={sendMessageMutation.isPending}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">
              {channels.length === 0
                ? "Create a channel to get started"
                : "Select a channel to view messages"}
            </p>
          </div>
        )}
      </div>

      {/* Create channel dialog */}
      <CreateChannelDialog
        open={isCreateChannelOpen}
        onOpenChange={setIsCreateChannelOpen}
        onCreateChannel={handleCreateChannel}
        isPending={createChannelMutation.isPending}
      />
    </div>
  );
}
