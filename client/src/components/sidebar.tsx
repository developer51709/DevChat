import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Hash, MessageSquare, Plus, Settings, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { type ChannelWithCreator, type User } from "@shared/schema";

interface SidebarProps {
  channels: ChannelWithCreator[];
  conversations: User[];
  activeChannelId: string | null;
  activeDMUserId: string | null;
  onChannelSelect: (id: string) => void;
  onDMSelect: (userId: string) => void;
  onCreateChannel: () => void;
  onEditChannel: (channel: ChannelWithCreator) => void;
  onDeleteChannel: (channel: ChannelWithCreator) => void;
  isLoading: boolean;
  isAdmin: boolean;
}

export function Sidebar({
  channels,
  conversations,
  activeChannelId,
  activeDMUserId,
  onChannelSelect,
  onDMSelect,
  onCreateChannel,
  onEditChannel,
  onDeleteChannel,
  isLoading,
  isAdmin,
}: SidebarProps) {
  const safeChannels = Array.isArray(channels) ? channels : [];
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="flex flex-col h-full bg-[#2b2d31] text-[#949ba4]">
      <div className="p-4 shadow-sm flex items-center justify-between">
        <h1 className="font-bold text-white truncate">Discord Devs</h1>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-4 pt-4">
        <div>
          <div className="flex items-center justify-between px-2 mb-1 group">
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-[#dbdee1] transition-colors">
              Text Channels
            </span>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 text-[#949ba4] hover:text-[#dbdee1]"
                onClick={onCreateChannel}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-[2px]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full bg-white/5 mx-2" />
              ))
            ) : (
              safeChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onChannelSelect(channel.id)}
                  className={`
                    w-full flex items-center gap-2 px-2 py-1 rounded-md transition-colors group
                    ${activeChannelId === channel.id 
                      ? "bg-[#3f4147] text-white" 
                      : "hover:bg-[#35373c] hover:text-[#dbdee1]"}
                  `}
                >
                  <Hash className="h-5 w-5 text-[#80848e]" />
                  <span className="truncate flex-1 text-left">{channel.name}</span>
                  {isAdmin && (
                    <div className="hidden group-hover:flex items-center gap-1">
                      <Settings
                        className="h-3.5 w-3.5 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditChannel(channel);
                        }}
                      />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-2 mb-1 group">
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-[#dbdee1] transition-colors">
              Direct Messages
            </span>
          </div>
          <div className="space-y-[2px]">
            {safeConversations.length === 0 ? (
              <p className="px-2 text-xs italic opacity-50">No DMs yet</p>
            ) : (
              safeConversations.map((convUser) => (
                <button
                  key={convUser.id}
                  onClick={() => onDMSelect(convUser.id)}
                  className={`
                    w-full flex items-center gap-2 px-2 py-1 rounded-md transition-colors group
                    ${activeDMUserId === convUser.id 
                      ? "bg-[#3f4147] text-white" 
                      : "hover:bg-[#35373c] hover:text-[#dbdee1]"}
                  `}
                >
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {(convUser.displayName || convUser.username).slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <span className="truncate flex-1 text-left">
                    {convUser.displayName || convUser.username}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
