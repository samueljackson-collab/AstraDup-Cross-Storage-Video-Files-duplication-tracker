
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { DashboardIcon, ScanIcon, SettingsIcon, SparklesIcon } from './Icons';
import Button from './Button';

const NavItem: React.FC<{ to: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; children: React.ReactNode; collapsed: boolean; }> = ({ to, icon: Icon, children, collapsed }) => {
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-2 text-base font-semibold rounded-lg transition-colors duration-200 group ${
      isActive
        ? 'bg-green-900/50 text-green-300'
        : 'text-green-600 hover:bg-green-900/20 hover:text-green-400'
    }`;
    
    return (
        <NavLink to={to} className={navLinkClasses}>
            <Icon className="h-6 w-6 shrink-0" />
            <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>{children}</span>
        </NavLink>
    );
};

const Header: React.FC<{ onToggle: () => void; }> = ({ onToggle }) => {
    const location = useLocation();
    const getTitle = () => {
        const path = location.pathname.split('/')[1] || 'dashboard';
        if (path.startsWith('file') || path.startsWith('compare')) return "File Details";
        if (path === 'analyzer') return "AI Analyzer";
        return path.charAt(0).toUpperCase() + path.slice(1);
    }
    
    return (
        <header className="flex items-center justify-between h-16 px-6 border-b border-green-800 flex-shrink-0">
            <div className="flex items-center">
                <button onClick={onToggle} className="p-2 rounded-md text-green-500 hover:bg-green-900/20 hover:text-green-300 md:hidden">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
                <h1 className="text-2xl font-bold text-green-400 ml-2 md:ml-0">{getTitle()}</h1>
            </div>
            {getTitle() === 'Dashboard' && (
                <NavLink to="/scan">
                    <Button>Start New Scan</Button>
                </NavLink>
            )}
        </header>
    );
}

const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-64';

  const SidebarContent = () => (
     <div className="flex flex-col h-full p-4">
        <div className={`flex items-center mb-8 shrink-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <svg className="h-8 w-8 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 12 2.5Zm0 17a7.5 7.5 0 1 1 7.5-7.5A7.5 7.5 0 0 1 12 19.5ZM12 6a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 0 1.5 0v-5.5A.75.75 0 0 0 12 6Zm0 8.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/></svg>
          <h1 className={`ml-3 text-2xl font-extrabold tracking-tight text-green-400 transition-opacity duration-200 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>AstraDup</h1>
        </div>
        <nav className="space-y-2">
          <NavItem to="/" icon={DashboardIcon} collapsed={sidebarCollapsed}>Dashboard</NavItem>
          <NavItem to="/scan" icon={ScanIcon} collapsed={sidebarCollapsed}>Duplicate Scan</NavItem>
          <NavItem to="/analyzer" icon={SparklesIcon} collapsed={sidebarCollapsed}>AI Analyzer</NavItem>
          <NavItem to="/settings" icon={SettingsIcon} collapsed={sidebarCollapsed}>Settings</NavItem>
        </nav>
        <div className="mt-auto hidden md:block">
            <button onClick={toggleSidebar} className="flex items-center w-full p-2 text-sm font-medium rounded-lg text-green-600 hover:bg-green-900/20 hover:text-green-400">
                <svg className={`h-6 w-6 shrink-0 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>Collapse</span>
            </button>
        </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-black text-green-400">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-shrink-0 flex-col bg-black border-r border-green-800 transition-all duration-300 ${sidebarWidth}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
       <div className={`fixed inset-0 z-40 flex md:hidden ${mobileSidebarOpen ? '' : 'pointer-events-none'}`}>
          <div onClick={toggleMobileSidebar} className={`absolute inset-0 bg-black/80 transition-opacity ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0'}`}></div>
          <aside className={`relative w-64 flex-shrink-0 flex-col bg-black border-r border-green-800 transition-transform duration-300 transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <SidebarContent />
          </aside>
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <Header onToggle={toggleMobileSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;