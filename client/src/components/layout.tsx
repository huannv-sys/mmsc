import React from 'react';
import { Link, useRoute } from 'wouter';
import { CpuIcon, ServerIcon, WifiIcon, SettingsIcon, AlertCircleIcon, ListIcon, ShieldIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isOnDashboardPage] = useRoute('/');
  const [isOnDevicesPage] = useRoute('/devices');
  const [isOnWirelessPage] = useRoute('/wireless');
  const [isOnCapsmanPage] = useRoute('/capsman');
  const [isOnAlertsPage] = useRoute('/alerts');
  const [isOnRulesPage] = useRoute('/rules');
  const [isOnSecurityPage] = useRoute('/security');

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-muted/30 border-r">
        <div className="flex items-center h-16 px-4 border-b">
          <h1 className="font-semibold">Mikrotik Monitor</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/">
            <a 
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isOnDashboardPage ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              <CpuIcon className="w-5 h-5" />
              <span>Tổng quan</span>
            </a>
          </Link>
          <Link href="/devices">
            <a 
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isOnDevicesPage ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              <ServerIcon className="w-5 h-5" />
              <span>Thiết bị</span>
            </a>
          </Link>
          <Link href="/wireless">
            <a 
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isOnWirelessPage ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              <WifiIcon className="w-5 h-5" />
              <span>Wireless</span>
            </a>
          </Link>
          <Link href="/capsman">
            <a 
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isOnCapsmanPage ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              <WifiIcon className="w-5 h-5" />
              <span>CAPsMAN</span>
            </a>
          </Link>
          <Link href="/alerts">
            <a 
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isOnAlertsPage ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              <AlertCircleIcon className="w-5 h-5" />
              <span>Cảnh báo</span>
            </a>
          </Link>
          <Link href="/rules">
            <a 
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isOnRulesPage ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              <ListIcon className="w-5 h-5" />
              <span>Rules</span>
            </a>
          </Link>
          <Link href="/security">
            <a 
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isOnSecurityPage ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              <ShieldIcon className="w-5 h-5" />
              <span>Bảo mật</span>
            </a>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <Link href="/settings">
            <a className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50">
              <SettingsIcon className="w-5 h-5" />
              <span>Cài đặt</span>
            </a>
          </Link>
        </div>
      </div>
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="md:hidden flex items-center justify-between h-16 px-4 border-b">
          <h1 className="font-semibold">Mikrotik Monitor</h1>
          <button className="p-2 rounded-md hover:bg-accent/50">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="lucide lucide-menu"
            >
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}