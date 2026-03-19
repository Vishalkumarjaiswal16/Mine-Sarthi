import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { LogOut, User } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="navbar-header h-16 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-3 sm:px-6 min-h-[4rem] max-h-[4rem]">
            <div className="flex items-center min-w-0 flex-1">
              <SidebarTrigger className="mr-2 sm:mr-4 focus-ring flex-shrink-0" />
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div 
                  className="w-8 h-8 rounded-full flex-shrink-0 bg-transparent relative overflow-hidden" 
                  style={{ 
                    aspectRatio: '1/1'
                  }}
                >
                  <img
                    src="/preview.png"
                    alt="MINE SARTHI Logo"
                    className="w-full h-full object-cover rounded-full"
                    style={{
                      objectPosition: 'center 35%',
                      filter: 'none',
                      imageRendering: 'auto'
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1 hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">MINE SARTHI</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">THE CHARIOTEER OF SUSTAINABLE MINING</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-1 sm:flex-initial max-w-md mx-2 flex-shrink-0">
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <NotificationBell />
              {user ? (
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
                  <Button variant="ghost" size="sm" onClick={logout} title="Logout" className="focus-ring">
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span className="sr-only">Logout</span>
                  </Button>
                </div>
              ) : null}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-full w-full bg-gradient-to-br from-background via-background to-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
