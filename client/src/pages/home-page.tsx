import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { ChannelList } from "@/components/channel-list";
import { MessageList } from "@/components/message-list";
import { MessageInput } from "@/components/message-input";
import { UserProfile } from "@/components/user-profile";
import { CreateChannelDialog } from "@/components/create-channel-dialog";
import { EditChannelDialog } from "@/components/edit-channel-dialog";
import { DeleteChannelDialog } from "@/components/delete-channel-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Menu, X as CloseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [isDeleteChannelOpen, setIsDeleteChannelOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelWithCreator | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  // WebSocket handler for real-time messages
  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === "NEW_MESSAGE" || data.type === "UPDATE_MESSAGE" || data.type === "DELETE_MESSAGE") {
      queryClient.invalidateQueries({
        queryKey: ["/api/channels", data.channelId, "messages"],
      });
    }
  }, []);

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

  // Edit channel mutation
  const editChannelMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const res = await apiRequest("PATCH", `/api/channels/${id}`, { name, description });
      return await res.json();
    },
    onSuccess: (updatedChannel: ChannelWithCreator) => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      setIsEditChannelOpen(false);
      setSelectedChannel(null);
      toast({
        title: "Channel updated",
        description: `#${updatedChannel.name} has been updated`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update channel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete channel mutation
  const deleteChannelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      setIsDeleteChannelOpen(false);
      if (selectedChannel?.id === activeChannelId) {
        setActiveChannelId(channels.find(c => c.id !== selectedChannel?.id)?.id || null);
      }
      setSelectedChannel(null);
      toast({
        title: "Channel deleted",
        description: "The channel has been deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete channel",
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

  const handleEditChannel = (id: string, name: string, description?: string) => {
    editChannelMutation.mutate({ id, name, description });
  };

  const handleDeleteChannel = (id: string) => {
    deleteChannelMutation.mutate(id);
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
  const userMessageCount = messages.filter((m) => m.userId === user?.id).length;

  return (
    <div className="h-screen flex bg-background overflow-hidden relative">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 w-72 bg-background border-r border-border z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-full flex flex-col">
          <div className="lg:hidden p-4 border-b flex justify-between items-center">
            <span className="font-bold">Channels</span>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <CloseIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ChannelList
              channels={channels}
              activeChannelId={activeChannelId}
              onChannelSelect={(id) => {
                setActiveChannelId(id);
                setIsSidebarOpen(false);
              }}
              onCreateChannel={() => setIsCreateChannelOpen(true)}
              onEditChannel={(channel) => {
                setSelectedChannel(channel);
                setIsEditChannelOpen(true);
              }}
              onDeleteChannel={(channel) => {
                setSelectedChannel(channel);
                setIsDeleteChannelOpen(true);
              }}
              isLoading={channelsLoading}
              isAdmin={isAdmin}
            />
          </div>
          {user && (
            <UserProfile
              user={user}
              messageCount={userMessageCount}
              onLogout={() => logoutMutation.mutate()}
            />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-border px-4 flex items-center justify-between bg-background lg:justify-start">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex-1 truncate">
            {activeChannel ? (
              <div>
                <h1 className="text-base font-semibold text-foreground truncate">
                  # {activeChannel.name}
                </h1>
                {activeChannel.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {activeChannel.description}
                  </p>
                )}
              </div>
            ) : (
              <h1 className="text-base font-semibold text-muted-foreground">
                Select a channel
              </h1>
            )}
          </div>
        </div>

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
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-muted-foreground">
                {channels.length === 0
                  ? isAdmin ? "Create a channel to get started" : "No channels available yet"
                  : "Select a channel to view messages"}
              </p>
              <Button
                variant="outline"
                className="mt-4 lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                View Channels
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateChannelDialog
        open={isCreateChannelOpen}
        onOpenChange={setIsCreateChannelOpen}
        onCreateChannel={handleCreateChannel}
        isPending={createChannelMutation.isPending}
      />

      <EditChannelDialog
        open={isEditChannelOpen}
        onOpenChange={setIsEditChannelOpen}
        channel={selectedChannel}
        onEditChannel={handleEditChannel}
        isPending={editChannelMutation.isPending}
      />

      <DeleteChannelDialog
        open={isDeleteChannelOpen}
        onOpenChange={setIsDeleteChannelOpen}
        channel={selectedChannel}
        onDeleteChannel={handleDeleteChannel}
        isPending={deleteChannelMutation.isPending}
      />
    </div>
  );
}
