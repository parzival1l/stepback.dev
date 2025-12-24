import React, { useState, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ChatWindow from './components/ChatWindow';
import SessionSidebar from './components/SessionSidebar';
import TreeGraph from './components/TreeGraph';
import { MessageSquare, GitGraph, ChevronRight, Sun, Moon } from 'lucide-react';
import { useDarkMode } from './hooks/useDarkMode';

function App() {
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'graph'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarPanelRef = useRef(null);
  const { toggleTheme, isDark } = useDarkMode();

  const handleToggleSidebar = () => {
    const newCollapsedState = !isSidebarCollapsed;

    // Use imperative API to collapse/expand
    if (sidebarPanelRef.current) {
      if (newCollapsedState) {
        sidebarPanelRef.current.collapse();
      } else {
        sidebarPanelRef.current.expand();
      }
    }

    // Update state - callbacks will also update it, but we do it here for immediate UI feedback
    setIsSidebarCollapsed(newCollapsedState);
  };

  return (
    <div className="h-screen bg-claude-light text-claude-text font-serif flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-claude-secondary/30 px-5 py-3.5 flex items-center justify-between glass shrink-0 z-20">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-claude-primary/20">
              <GitGraph size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-claude-text">
                stepback.dev
              </h1>
              <div className="text-[10px] font-medium text-claude-secondary tracking-wide uppercase">
                Git-Style LLM Interface
              </div>
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex bg-claude-light rounded-xl p-1 ml-4 border border-claude-secondary/30">
            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeView === 'chat'
                  ? 'bg-claude-white shadow-md shadow-claude-secondary/20 text-claude-text ring-1 ring-claude-secondary/30'
                  : 'text-claude-secondary hover:text-claude-text hover:bg-claude-white/50'
                }`}
            >
              <MessageSquare size={16} />
              Chat
            </button>
            <button
              onClick={() => setActiveView('graph')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeView === 'graph'
                  ? 'bg-claude-white shadow-md shadow-claude-secondary/20 text-claude-text ring-1 ring-claude-secondary/30'
                  : 'text-claude-secondary hover:text-claude-text hover:bg-claude-white/50'
                }`}
            >
              <GitGraph size={16} />
              Graph
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-claude-secondary/30 bg-claude-white
            hover:bg-claude-light transition-all duration-200
            text-claude-secondary hover:text-claude-text
            shadow-sm hover:shadow-md"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main Content with Resizable Panels */}
      <div className="flex-1 overflow-hidden relative">
        {/* Expand Button (shown when sidebar is collapsed) */}
        {isSidebarCollapsed && (
          <button
            onClick={handleToggleSidebar}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-12 rounded-r-lg bg-claude-white border border-claude-secondary/40
                shadow-md hover:shadow-lg flex items-center justify-center
                hover:bg-claude-light transition-all duration-200
                text-claude-secondary hover:text-claude-text"
            title="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}

        <PanelGroup direction="horizontal" autoSaveId="stepback-layout">
          {/* Sidebar Panel */}
          <Panel
            ref={sidebarPanelRef}
            defaultSize={20}
            minSize={12}
            maxSize={35}
            collapsedSize={0}
            collapsible={true}
            onCollapse={() => setIsSidebarCollapsed(true)}
            onExpand={() => setIsSidebarCollapsed(false)}
            className="bg-claude-light relative"
          >
            <SessionSidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={handleToggleSidebar}
            />
          </Panel>

          {/* Resize Handle */}
          {!isSidebarCollapsed && (
            <PanelResizeHandle className="resize-handle hover:bg-gradient-to-b hover:from-transparent hover:via-claude-primary/30 hover:to-transparent" />
          )}

          {/* Main Content Panel */}
          <Panel minSize={50}>
            <div className="h-full w-full overflow-hidden relative bg-claude-light">
              {/* Chat View */}
              <div className={`h-full w-full ${activeView === 'chat' ? 'block' : 'hidden'}`}>
                <ChatWindow />
              </div>
              {/* Graph View */}
              <div className={`h-full w-full ${activeView === 'graph' ? 'block' : 'hidden'}`}>
                <TreeGraph />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
