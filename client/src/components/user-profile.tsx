import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon, MessageSquare, Flag } from "lucide-react";
import { type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface UserProfileProps {
  user: any;
  messageCount?: number;
  onLogout: () => void;
  onStartDM?: (userId: string) => void;
}

export function UserProfile({ user, messageCount = 0, onLogout, onStartDM }: UserProfileProps) {
  const { user: currentUser } = useAuth() as { user: any | null };
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="p-4 border-t border-card-border bg-card">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto p-2 hover-elevate"
            data-testid="button-user-profile"
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-status-online border-2 border-card rounded-full" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-foreground truncate" data-testid="text-username">
                {user.displayName || user.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {messageCount} messages
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/settings">
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} data-testid="button-logout">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {!isOwnProfile && (
        <div className="mt-4 flex flex-col gap-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 hover-elevate"
            onClick={() => onStartDM?.(user.id)}
          >
            <MessageSquare className="h-4 w-4" />
            Direct Message
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-red-400 hover:text-red-400 hover:bg-red-500/10 hover-elevate"
            onClick={() => {
               const reason = window.prompt("Reason for report?");
               if (reason) {
                 apiRequest("POST", "/api/reports", { targetUserId: user.id, reason });
               }
            }}
          >
            <Flag className="h-4 w-4" />
            Report User
          </Button>
        </div>
      )}
    </div>
  );
}
