'use client';

import React, { useState, useEffect } from 'react';
import { DataProvider } from '../../components/providers/DataProvider';
import GlobalControls from '../../components/controls/GlobalControls';
import { Menu, Activity, ShieldAlert, Cpu, BarChart3, Database, Moon, Sun } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <DataProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))] select-none">
        
        {/* SLIM NAVIGATION RAIL */}
        <aside 
          className={`flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-200 ${
            isSidebarOpen ? 'w-20' : 'w-0 -translate-x-full md:w-12 md:translate-x-0'
          }`}
          style={{ height: '100vh', flexShrink: 0 }}
        >
          {/* Top Logo */}
          <div className="flex h-12 items-center justify-center border-b border-[hsl(var(--border))] overflow-hidden shrink-0">
            <div className="flex flex-col items-center justify-center gap-0.5">
              <Activity className="h-4.5 w-4.5 text-[hsl(var(--primary))]" />
              <span className={`text-[8px] font-mono tracking-wider font-black opacity-85 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                AETHER
              </span>
            </div>
          </div>

          {/* Links: Slim Nav Stack */}
          <nav className="flex-1 space-y-2 py-4 px-1 overflow-y-auto flex flex-col items-center">
            
            <button className="flex flex-col items-center justify-center gap-1 rounded w-full py-2.5 text-center transition-colors bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] border-l-2 border-[hsl(var(--primary))]">
              <BarChart3 className="h-4.5 w-4.5 shrink-0" />
              <span className={`text-[9px] font-mono font-bold tracking-wide uppercase transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                SYSTEM
              </span>
            </button>
            
            <button className="flex flex-col items-center justify-center gap-1 rounded w-full py-2.5 text-center transition-colors text-[hsl(var(--muted-foreground))] hover:bg-black/2 dark:hover:bg-white/2 hover:text-[hsl(var(--foreground))]">
              <Database className="h-4.5 w-4.5 shrink-0" />
              <span className={`text-[9px] font-mono font-bold tracking-wide uppercase transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                STREAMS
              </span>
            </button>

            <button className="flex flex-col items-center justify-center gap-1 rounded w-full py-2.5 text-center transition-colors text-[hsl(var(--muted-foreground))] hover:bg-black/2 dark:hover:bg-white/2 hover:text-[hsl(var(--foreground))]">
              <Cpu className="h-4.5 w-4.5 shrink-0" />
              <span className={`text-[9px] font-mono font-bold tracking-wide uppercase transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                ENGINE
              </span>
            </button>

            <button className="flex flex-col items-center justify-center gap-1 rounded w-full py-2.5 text-center transition-colors text-[hsl(var(--muted-foreground))] hover:bg-black/2 dark:hover:bg-white/2 hover:text-[hsl(var(--foreground))]">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
              <span className={`text-[9px] font-mono font-bold tracking-wide uppercase transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                ALERTS
              </span>
            </button>

          </nav>

          {/* Footer Status */}
          <div className="border-t border-[hsl(var(--border))] py-3 overflow-hidden text-center shrink-0">
            <div className="flex flex-col items-center gap-1 text-[9px] font-mono font-bold text-[hsl(var(--muted-foreground))]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}>SYS_OK</span>
            </div>
          </div>
        </aside>

        {/* MAIN PANEL */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          
          {/* TOP CONTEXT BAR (GLOBAL COMMAND HEADER) */}
          <header className="flex h-12 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 shrink-0 gap-4">
            
            {/* Title & Badge */}
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="rounded p-1 hover:bg-[hsl(var(--secondary))] transition-colors border border-transparent hover:border-[hsl(var(--border))]"
              >
                <Menu className="h-4 w-4" />
              </button>
              <span className="h-4 w-[1px] bg-[hsl(var(--border))] shrink-0" />
              <h1 className="text-[14px] font-bold tracking-wide flex items-center gap-2 truncate">
                <span>System Observability Center</span>
                <span className="font-mono text-[9px] font-normal px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] shrink-0">
                  NODE_LOCAL_0
                </span>
              </h1>
            </div>

            {/* Global Controls & Theme Toggle */}
            <div className="flex items-center gap-3">
              <GlobalControls />
              <span className="h-4 w-[1px] bg-[hsl(var(--border))]" />
              <button 
                onClick={toggleTheme}
                className="rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-all bg-[hsl(var(--card))] p-1.5"
                title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> : <Moon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
              </button>
            </div>

          </header>

          {/* MAIN PAGE */}
          <main className="flex-1 overflow-y-auto bg-[hsl(var(--background))]">
            {children}
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
