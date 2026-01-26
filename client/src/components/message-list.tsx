import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Pencil, Trash2, X, Check } from "lucide-react";
import { type MessageWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Link } from "wouter";

interface MessageListProps {
  messages: MessageWithUser[];
  isLoading: boolean;
  currentUserId: string;
}

export function MessageList({ messages, isLoading, currentUserId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      await apiRequest("PATCH", `/api/messages/${id}`, { content });
    },
    onSuccess: () => {
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/messages/${id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground text-base">
            No messages yet. Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {messages.map((message, index) => {
          const showAvatar =
            index === 0 || messages[index - 1].userId !== message.userId;
          const isCurrentUser = message.userId === currentUserId;
          const isEditing = editingId === message.id;

          return (
            <div
              key={message.id}
              className={`group flex gap-3 hover:bg-accent/50 rounded-md p-3 transition-colors ${
                showAvatar ? "mt-4" : "mt-1"
              }`}
              data-testid={`message-${message.id}`}
            >
              <div className="flex-shrink-0">
                {showAvatar ? (
                  <Link href={`/profile/${message.userId}`}>
                    <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {(message.user.displayName || message.user.username).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ) : (
                  <div className="w-10" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {showAvatar && (
                  <div className="flex items-baseline gap-2 mb-1">
                    <Link href={`/profile/${message.userId}`}>
                      <span
                        className={`font-semibold text-sm cursor-pointer hover:underline ${
                          isCurrentUser ? "text-primary" : "text-foreground"
                        }`}
                        data-testid={`message-username-${message.id}`}
                      >
                        {message.user.displayName || message.user.username}
                      </span>
                    </Link>
                    <span
                      className="text-xs text-muted-foreground"
                      data-testid={`message-timestamp-${message.id}`}
                    >
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
                
                {isEditing ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <textarea
                      autoFocus
                      className="w-full bg-background border border-border rounded-md p-2 text-base resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          updateMutation.mutate({ id: message.id, content: editContent });
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: message.id, content: editContent })}>
                        <Check className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-base text-foreground break-words"
                    data-testid={`message-content-${message.id}`}
                  >
                    {message.content}
                  </p>
                )}
              </div>

              {isCurrentUser && !isEditing && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingId(message.id);
                      setEditContent(message.content);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(message.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
