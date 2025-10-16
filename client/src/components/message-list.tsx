import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { type MessageWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface MessageListProps {
  messages: MessageWithUser[];
  isLoading: boolean;
  currentUserId: string;
}

export function MessageList({ messages, isLoading, currentUserId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > prevMessagesLengthRef.current) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

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

          return (
            <div
              key={message.id}
              className={`group flex gap-3 hover-elevate rounded-md p-3 transition-colors ${
                showAvatar ? "mt-4" : "mt-1"
              }`}
              data-testid={`message-${message.id}`}
            >
              <div className="flex-shrink-0">
                {showAvatar ? (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {message.user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {showAvatar && (
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className={`font-semibold text-sm ${
                        isCurrentUser ? "text-primary" : "text-foreground"
                      }`}
                      data-testid={`message-username-${message.id}`}
                    >
                      {message.user.username}
                    </span>
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
                <p
                  className="text-base text-foreground break-words"
                  data-testid={`message-content-${message.id}`}
                >
                  {message.content}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
