import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Hash, MessageSquare, Plus, Settings, Shield, User as UserIcon, Flag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { type ChannelWithCreator, type User, type ReportWithDetails } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

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
              channels.map((channel) => (
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
            {conversations.length === 0 ? (
              <p className="px-2 text-xs italic opacity-50">No DMs yet</p>
            ) : (
              conversations.map((convUser) => (
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

        <div className="pt-4 border-t border-white/5 space-y-2">
          <ReportsDialog />
          {isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" className="w-full justify-start gap-2 text-[#949ba4] hover:text-white">
                <Shield className="h-4 w-4" />
                Admin Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportsDialog() {
  const { toast } = useToast();
  const { data: reports = [], isLoading } = useQuery<ReportWithDetails[]>({
    queryKey: ["/api/admin/reports"],
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/admin/reports/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({ title: "Report status updated" });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 text-[#949ba4] hover:text-white">
          <Shield className="h-4 w-4" />
          Moderation Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-[#313338] border-[#1f2124] text-[#dbdee1]">
        <DialogHeader>
          <DialogTitle className="text-white">Pending Reports</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {isLoading ? (
              <p>Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-center py-8 opacity-50">No reports found</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-4 bg-[#2b2d31] rounded-lg border border-[#1f2124]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-primary font-bold uppercase">{report.status}</span>
                      <p className="text-sm">
                        <span className="text-white font-semibold">{report.reporter.username}</span> reported{" "}
                        {report.targetUser && (
                          <span className="text-white font-semibold">{report.targetUser.username}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => resolveMutation.mutate({ id: report.id, status: "dismissed" })}
                      >
                        Dismiss
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => resolveMutation.mutate({ id: report.id, status: "resolved" })}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-[#dbdee1] italic">"{report.reason}"</p>
                  {report.targetMessage && (
                    <div className="mt-2 p-2 bg-[#1e1f22] rounded text-xs">
                      <p className="opacity-50 mb-1">Reported Message:</p>
                      <p>{report.targetMessage.content}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
