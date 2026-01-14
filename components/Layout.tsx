
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { DashboardIcon, ScanIcon, SettingsIcon } from './Icons';

const Layout: React.FC = () => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-slate-800 text-white'
        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50">
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 p-4">
        <div className="flex items-center mb-8">
          <svg className="h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 12 2.5Zm0 17a7.5 7.5 0 1 1 7.5-7.5A7.5 7.5 0 0 1 12 19.5ZM12 6a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 0 1.5 0v-5.5A.75.75 0 0 0 12 6Zm0 8.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/></svg>
          <h1 className="ml-3 text-xl font-bold tracking-tight text-white">AstraDup</h1>
        </div>
        <nav className="space-y-2">
          <NavLink to="/" className={navLinkClasses}>
            <DashboardIcon className="h-5 w-5 mr-3" />
            Dashboard
          </NavLink>
          <NavLink to="/scan" className={navLinkClasses}>
            <ScanIcon className="h-5 w-5 mr-3" />
            Duplicate Scan
          </NavLink>
          <NavLink to="/settings" className={navLinkClasses}>
            <SettingsIcon className="h-5 w-5 mr-3" />
            Settings
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
