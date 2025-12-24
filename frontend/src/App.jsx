import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import SessionSidebar, { SidebarToggle } from './components/SessionSidebar';
import TreeGraph from './components/TreeGraph';
import AuthGate from './components/AuthGate';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MessageSquare, GitGraph, Sun, Moon, LogOut } from 'lucide-react';
import { useDarkMode } from './hooks/useDarkMode';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Main app content (shown when authenticated)
function AppContent() {
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'graph'
  const { toggleTheme, isDark } = useDarkMode();
  const { logout } = useAuth();

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <div className="h-screen bg-background text-foreground flex w-full overflow-hidden">
          {/* Sidebar */}
          <SessionSidebar />

          {/* Main Content */}
          <SidebarInset className="flex flex-col overflow-hidden">
            {/* Header */}
            <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 z-20">
              <div className="flex items-center gap-3">
                {/* Sidebar Toggle - Far Left */}
                <SidebarToggle />

                {/* Logo */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                    <GitGraph size={16} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-foreground leading-none">
                      stepback.dev
                    </h1>
                    <div className="text-[10px] font-medium text-muted-foreground tracking-wide">
                      Git-Style LLM Interface
                    </div>
                  </div>
                </div>

                {/* View Toggles */}
                <div className="flex bg-muted rounded-lg p-1 ml-2">
                  <button
                    onClick={() => setActiveView('chat')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                      activeView === 'chat'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <MessageSquare size={14} />
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveView('graph')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                      activeView === 'graph'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <GitGraph size={14} />
                    Graph
                  </button>
                </div>
              </div>

              {/* Right side controls */}
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={toggleTheme}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                    >
                      {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  </TooltipContent>
                </Tooltip>

                {/* Logout Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={logout}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    >
                      <LogOut size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Logout
                  </TooltipContent>
                </Tooltip>
              </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
              {/* Chat View */}
              <div className={cn("h-full w-full", activeView === 'chat' ? 'block' : 'hidden')}>
                <ChatWindow />
              </div>
              {/* Graph View */}
              <div className={cn("h-full w-full", activeView === 'graph' ? 'block' : 'hidden')}>
                <TreeGraph />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Root App component with auth logic
function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

// Component that handles auth state switching
function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return <AppContent />;
}

export default App;
