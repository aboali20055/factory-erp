import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, DollarSign, Package,
  Scissors, Shirt, CreditCard, BadgeDollarSign, Boxes,
  Users, LogOut, Factory, X,
} from 'lucide-react';
import { cn } from '../../utils';
import { useAuthStore } from '../../store/auth.store';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/inventory/fabric', label: 'مخزن القماش', icon: Shirt },
  { to: '/inventory/ready-stock', label: 'مخزن الاستوك', icon: Package },
  { to: '/inventory/accessories', label: 'الإكسسوارات', icon: Boxes },
  { to: '/production/cutting', label: 'رقم القص', icon: Scissors },
  { to: '/production/models', label: 'رقم الموديل', icon: Factory },
  { to: '/sales', label: 'بيان المبيعات', icon: ShoppingCart },
  { to: '/finance/expenses', label: 'المصاريف والإيرادات', icon: DollarSign, roles: ['ADMIN', 'MANAGER'] },
  { to: '/finance/debts', label: 'الديون', icon: CreditCard, roles: ['ADMIN', 'MANAGER'] },
  { to: '/finance/client-accounts', label: 'حساب عميل', icon: BadgeDollarSign },
  { to: '/admin/users', label: 'إدارة المستخدمين', icon: Users, roles: ['ADMIN'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const visibleItems = navItems.filter(
    (item) => !item.roles || hasRole(...(item.roles as any[]))
  );

  const handleNavClick = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 right-0 h-full z-50 w-64 bg-[#0f1c33] text-white flex flex-col',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0">
              <Factory size={18} />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">نظام إدارة المصنع</h1>
              <p className="text-[10px] text-white/40 mt-0.5">ERP System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <ul className="space-y-0.5">
            {visibleItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer',
                    isActive
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-white/60 hover:bg-white/10 hover:text-white',
                  )}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item.to); }}
                >
                  <item.icon size={17} className="flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info + logout */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 flex-shrink-0">
              {user?.name?.charAt(0) ?? '؟'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/40 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
