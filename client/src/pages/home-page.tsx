import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Sidebar } from "@/components/sidebar";
import { MessageList } from "@/components/message-list";
import { MessageInput } from "@/components/message-input";
import { UserProfile } from "@/components/user-profile";
import { CreateChannelDialog } from "@/components/create-channel-dialog";
import { EditChannelDialog } from "@/components/edit-channel-dialog";
import { DeleteChannelDialog } from "@/components/delete-channel-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  type ChannelWithCreator,
  type MessageWithUser,
  type InsertChannel,
  type User,
  type DirectMessageWithUsers,
} from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeDMUserId, setActiveDMUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"channel" | "dm">("channel");
  
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [isDeleteChannelOpen, setIsDeleteChannelOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelWithCreator | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === "NEW_MESSAGE" || data.type === "UPDATE_MESSAGE" || data.type === "DELETE_MESSAGE") {
      queryClient.invalidateQueries({
        queryKey: ["/api/channels", data.channelId, "messages"],
      });
    } else if (data.type === "NEW_DM") {
      queryClient.invalidateQueries({ queryKey: ["/api/dms/conversations"] });
      if (activeDMUserId === data.dm.senderId || activeDMUserId === data.dm.receiverId) {
        queryClient.invalidateQueries({ queryKey: ["/api/dms", activeDMUserId] });
      }
    }
  }, [activeDMUserId]);

  useWebSocket(handleWebSocketMessage, !!user);

  const { data: channels = [], isLoading: channelsLoading } = useQuery<ChannelWithCreator[]>({
    queryKey: ["/api/channels"],
  });

  const { data: conversations = [] } = useQuery<User[]>({
    queryKey: ["/api/dms/conversations"],
    enabled: !!user,
  });

  // Fetch messages for active channel
  const { data: channelMessagesData = [], isLoading: messagesLoading } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/channels", activeChannelId, "messages"],
    enabled: viewMode === "channel" && !!activeChannelId,
  });
  const channelMessages = Array.isArray(channelMessagesData) ? channelMessagesData : [];

  const { data: dmMessages = [], isLoading: dmsLoading } = useQuery<DirectMessageWithUsers[]>({
    queryKey: ["/api/dms", activeDMUserId],
    enabled: viewMode === "dm" && !!activeDMUserId,
  });

  useEffect(() => {
    if (channels.length > 0 && !activeChannelId && !activeDMUserId) {
      setActiveChannelId(channels[0].id);
      setViewMode("channel");
    }
  }, [channels, activeChannelId, activeDMUserId]);

  const handleChannelSelect = (id: string) => {
    setActiveChannelId(id);
    setActiveDMUserId(null);
    setViewMode("channel");
    setIsSidebarOpen(false);
  };

  const handleDMSelect = (userId: string) => {
    setActiveDMUserId(userId);
    setActiveChannelId(null);
    setViewMode("dm");
    setIsSidebarOpen(false);
  };

  const createChannelMutation = useMutation({
    mutationFn: async (data: InsertChannel) => {
      const res = await apiRequest("POST", "/api/channels", data);
      return await res.json();
    },
    onSuccess: (newChannel: ChannelWithCreator) => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      setActiveChannelId(newChannel.id);
      setIsCreateChannelOpen(false);
      toast({ title: "Channel created", description: `#${newChannel.name} has been created successfully` });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; channelId?: string; receiverId?: string }) => {
      if (viewMode === "channel") {
        await apiRequest("POST", "/api/messages", { content: data.content, channelId: data.channelId });
      } else {
        await apiRequest("POST", "/api/dms", { content: data.content, receiverId: data.receiverId });
      }
    },
    onSuccess: () => {
      if (viewMode === "channel") {
        queryClient.invalidateQueries({ queryKey: ["/api/channels", activeChannelId, "messages"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/dms", activeDMUserId] });
        queryClient.invalidateQueries({ queryKey: ["/api/dms/conversations"] });
      }
    },
  });

  const handleSendMessage = (content: string) => {
    if (viewMode === "channel" && activeChannelId) {
      sendMessageMutation.mutate({ content, channelId: activeChannelId });
    } else if (viewMode === "dm" && activeDMUserId) {
      sendMessageMutation.mutate({ content, receiverId: activeDMUserId });
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeDMUser = conversations.find((u) => u.id === activeDMUserId);

  return (
    <div className="h-screen flex bg-background overflow-hidden relative">
      <div className={`
        fixed inset-y-0 left-0 w-72 bg-[#2b2d31] border-r border-border z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Sidebar
              channels={channels}
              conversations={conversations}
              activeChannelId={activeChannelId}
              activeDMUserId={activeDMUserId}
              onChannelSelect={handleChannelSelect}
              onDMSelect={handleDMSelect}
              onCreateChannel={() => setIsCreateChannelOpen(true)}
              onEditChannel={(c) => { setSelectedChannel(c); setIsEditChannelOpen(true); }}
              onDeleteChannel={(c) => { setSelectedChannel(c); setIsDeleteChannelOpen(true); }}
              isLoading={channelsLoading}
              isAdmin={isAdmin}
            />
          </div>
          {user && (
            <UserProfile
              user={user}
              messageCount={0}
              onLogout={() => logoutMutation.mutate()}
            />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
        <header className="h-14 border-b border-[#1f2124] px-4 flex items-center justify-between bg-[#313338] shadow-sm">
          <div className="flex items-center gap-2 truncate">
            <Button variant="ghost" size="icon" className="lg:hidden text-[#949ba4]" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            {viewMode === "channel" && activeChannel ? (
              <h1 className="text-base font-semibold text-white truncate"># {activeChannel.name}</h1>
            ) : viewMode === "dm" && activeDMUser ? (
              <h1 className="text-base font-semibold text-white truncate">@ {activeDMUser.displayName || activeDMUser.username}</h1>
            ) : null}
          </div>
          {isAdmin && viewMode === "channel" && (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 text-[#949ba4] hover:text-white">
                <Shield className="h-4 w-4" /> Admin
              </Button>
            </Link>
          )}
        </header>

        <main className="flex-1 flex flex-col min-h-0">
          {viewMode === "channel" && activeChannelId ? (
            <>
              <MessageList messages={channelMessages} isLoading={messagesLoading} currentUserId={user?.id || ""} />
              <MessageInput 
                channelName={activeChannel?.name || ""} 
                onSendMessage={handleSendMessage} 
                disabled={sendMessageMutation.isPending} 
              />
            </>
          ) : viewMode === "dm" && activeDMUserId ? (
            <>
              <MessageList 
                messages={dmMessages.map(dm => ({
                  ...dm,
                  user: dm.sender,
                  channelId: "dm"
                })) as any} 
                isLoading={dmsLoading} 
                currentUserId={user?.id || ""} 
              />
              <MessageInput 
                channelName={activeDMUser?.displayName || activeDMUser?.username || ""} 
                onSendMessage={handleSendMessage} 
                disabled={sendMessageMutation.isPending} 
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-[#949ba4]">Select a channel or message to get started</p>
            </div>
          )}
        </main>
      </div>

      <CreateChannelDialog 
        open={isCreateChannelOpen} 
        onOpenChange={setIsCreateChannelOpen} 
        onCreateChannel={(n, d) => createChannelMutation.mutate({ name: n, description: d })} 
        isPending={createChannelMutation.isPending} 
      />
    </div>
  );
}
