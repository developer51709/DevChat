import { Hash, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ChannelWithCreator } from "@shared/schema";

interface ChannelListProps {
  channels: ChannelWithCreator[];
  activeChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel: () => void;
  onEditChannel?: (channel: ChannelWithCreator) => void;
  onDeleteChannel?: (channel: ChannelWithCreator) => void;
  isLoading: boolean;
  isAdmin: boolean;
}

export function ChannelList({
  channels,
  activeChannelId,
  onChannelSelect,
  onCreateChannel,
  onEditChannel,
  onDeleteChannel,
  isLoading,
  isAdmin,
}: ChannelListProps) {
  return (
    <div className="flex flex-col h-full bg-card border-r border-card-border">
      <div className="p-4 border-b border-card-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">Channels</h2>
        {isAdmin && (
          <Button
            onClick={onCreateChannel}
            className="w-full"
            size="sm"
            data-testid="button-create-channel"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Channel
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : channels.length === 0 ? (
          <div className="p-8 text-center">
            <Hash className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              No channels yet
            </p>
            {isAdmin && (
              <Button
                onClick={onCreateChannel}
                variant="secondary"
                size="sm"
                data-testid="button-create-first-channel"
              >
                Create your first channel
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {channels.map((channel) => {
              const isActive = channel.id === activeChannelId;
              return (
                <div
                  key={channel.id}
                  className={`
                    group flex items-center gap-2 px-3 py-2 rounded-md
                    transition-colors duration-150
                    ${
                      isActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover-elevate"
                    }
                  `}
                  data-testid={`channel-item-${channel.id}`}
                >
                  <button
                    onClick={() => onChannelSelect(channel.id)}
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                  >
                    <Hash className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {channel.name}
                    </span>
                  </button>
                  {channel.messageCount !== undefined && channel.messageCount > 0 && !isActive && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {channel.messageCount}
                    </span>
                  )}
                  {isAdmin && (
                    <div className="invisible group-hover:visible flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditChannel?.(channel);
                        }}
                        data-testid={`button-edit-channel-${channel.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChannel?.(channel);
                        }}
                        data-testid={`button-delete-channel-${channel.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
