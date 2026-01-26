import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: user, isLoading } = useQuery<Omit<User, "password">>({
    queryKey: [`/api/users/${id}`],
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">User not found</h1>
        <Link href="/">
          <Button variant="outline">Go Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">User Profile</h1>
        </div>

        <Card className="overflow-hidden">
          <div className="h-32 bg-primary/20" />
          <CardHeader className="relative pb-0">
            <div className="absolute -top-12 left-6">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="pt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <CardTitle className="text-3xl">
                  {user.displayName || user.username}
                </CardTitle>
                <p className="text-muted-foreground">@{user.username}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                About Me
              </h3>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {user.bio || "This user hasn't added a bio yet."}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {format(new Date(user.createdAt), "MMMM yyyy")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
