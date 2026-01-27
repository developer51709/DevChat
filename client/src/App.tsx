import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import SettingsPage from "@/pages/settings-page";
import ProfilePage from "@/pages/profile-page";
import AdminPage from "@/pages/admin-page";
import SetupPage from "@/pages/setup-page";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function SetupGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  const { data: setupStatus, isLoading } = useQuery<{ setupRequired: boolean }>({
    queryKey: ["/api/setup/status"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If setup is required and we're not on the setup page, redirect to setup
  if (setupStatus?.setupRequired && location !== "/setup") {
    return <Redirect to="/setup" />;
  }

  // If setup is complete and we're on the setup page, redirect to home
  if (!setupStatus?.setupRequired && location === "/setup") {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/setup" component={SetupPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/profile/:id" component={ProfilePage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <SetupGuard>
            <Router />
          </SetupGuard>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
