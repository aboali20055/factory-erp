import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesPage from './pages/sales/SalesPage';
import CuttingPage from './pages/production/CuttingPage';
import ModelProductionPage from './pages/production/ModelProductionPage';
import FabricPage from './pages/inventory/FabricPage';
import ReadyStockPage from './pages/inventory/ReadyStockPage';
import AccessoriesPage from './pages/inventory/AccessoriesPage';
import ExpensesPage from './pages/finance/ExpensesPage';
import DebtsPage from './pages/finance/DebtsPage';
import ClientAccountsPage from './pages/finance/ClientAccountsPage';
import UsersPage from './pages/admin/UsersPage';

/** Redirect unauthenticated users to login */
function RequireAuth() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Only ADMIN can access this route */
function RequireAdmin() {
  const hasRole = useAuthStore(s => s.hasRole);
  if (!hasRole('ADMIN')) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },

          // Sales
          { path: 'sales', element: <SalesPage /> },

          // Production
          { path: 'production/cutting', element: <CuttingPage /> },
          { path: 'production/models', element: <ModelProductionPage /> },

          // Inventory
          { path: 'inventory/fabric', element: <FabricPage /> },
          { path: 'inventory/ready-stock', element: <ReadyStockPage /> },
          { path: 'inventory/accessories', element: <AccessoriesPage /> },

          // Finance
          { path: 'finance/expenses', element: <ExpensesPage /> },
          { path: 'finance/debts', element: <DebtsPage /> },
          { path: 'finance/client-accounts', element: <ClientAccountsPage /> },

          // Admin only
          {
            element: <RequireAdmin />,
            children: [{ path: 'admin/users', element: <UsersPage /> }],
          },

          // Fallback
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);
