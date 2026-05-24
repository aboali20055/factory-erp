import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 right-0 left-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">نظام المصنع</span>
        <div className="w-8" /> {/* Spacer */}
      </header>

      {/* Main content offset for sidebar */}
      <main className="lg:mr-64 min-h-screen">
        <div className="pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
