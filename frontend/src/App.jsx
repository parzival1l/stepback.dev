import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ChatWindow from './components/ChatWindow';
import SessionSidebar from './components/SessionSidebar';
import TreeGraph from './components/TreeGraph';
import { MessageSquare, GitGraph } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'graph'

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-gray-900 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-slate-200/60 px-5 py-3.5 flex items-center justify-between glass shrink-0 z-20">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GitGraph size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                TreeChat
              </h1>
              <div className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">
                Git-Style LLM Interface
              </div>
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex bg-slate-100/80 rounded-xl p-1 ml-4 border border-slate-200/50">
            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeView === 'chat'
                  ? 'bg-white shadow-md shadow-slate-200/50 text-blue-600 ring-1 ring-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
            >
              <MessageSquare size={16} />
              Chat
            </button>
            <button
              onClick={() => setActiveView('graph')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeView === 'graph'
                  ? 'bg-white shadow-md shadow-slate-200/50 text-purple-600 ring-1 ring-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
            >
              <GitGraph size={16} />
              Graph
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" autoSaveId="treechat-layout">
          {/* Sidebar Panel */}
          <Panel
            defaultSize={20}
            minSize={12}
            maxSize={35}
            className="bg-slate-50/50"
          >
            <SessionSidebar />
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="resize-handle hover:bg-gradient-to-b hover:from-transparent hover:via-blue-400/30 hover:to-transparent" />

          {/* Main Content Panel */}
          <Panel minSize={50}>
            <div className="h-full w-full overflow-hidden relative bg-gradient-to-br from-slate-50/50 to-white">
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
